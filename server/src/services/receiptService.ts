import { Receipt } from '../models/Receipt';
import { ReceiptLine } from '../models/ReceiptLine';
import { Errors } from '../middleware/errorHandler';
import { applyReceipt } from './stockEngine';
import { sequelize } from '../config/database';

export async function createReceipt(data: {
  warehouse_id: number;
  destination_location_id?: number | null;
  contact_id?: number | null;
  scheduled_date?: string | null;
  notes?: string | null;
}, userId: number) {
  // Generate reference: WH-RCP-XXXX
  // For simplicity, we just use RCP-<timestamp> for now, or find max ID.
  const reference = `RCP-${Date.now()}`;
  
  const receipt = await Receipt.create({
    ...data,
    reference,
    responsible_user_id: userId,
    status: 'draft',
  });
  return receipt;
}

export async function listReceipts() {
  return Receipt.findAll({
    include: [{ model: ReceiptLine, as: 'lines' }],
    order: [['created_at', 'DESC']],
  });
}

export async function getReceipt(id: number) {
  const receipt = await Receipt.findByPk(id, {
    include: [{ model: ReceiptLine, as: 'lines' }],
  });
  if (!receipt) throw Errors.notFound('Receipt');
  return receipt;
}

export async function updateReceiptHeader(id: number, data: any) {
  const receipt = await getReceipt(id);
  if (receipt.status === 'done' || receipt.status === 'canceled') {
    throw Errors.businessRule('Cannot modify a completed or canceled receipt.');
  }
  await receipt.update(data);
  return receipt;
}

export async function addOrUpdateLine(receiptId: number, data: { product_id: number, qty_expected: number, unit_cost: number }) {
  const receipt = await getReceipt(receiptId);
  if (receipt.status === 'done' || receipt.status === 'canceled') {
    throw Errors.businessRule('Cannot modify lines on a completed or canceled receipt.');
  }

  let line = await ReceiptLine.findOne({ where: { receipt_id: receiptId, product_id: data.product_id } });
  if (line) {
    line.qty_expected = data.qty_expected;
    line.unit_cost = data.unit_cost;
    await line.save();
  } else {
    line = await ReceiptLine.create({ ...data, receipt_id: receiptId });
  }
  return line;
}

export async function removeLine(receiptId: number, lineId: number) {
  const receipt = await getReceipt(receiptId);
  if (receipt.status === 'done' || receipt.status === 'canceled') {
    throw Errors.businessRule('Cannot modify lines on a completed or canceled receipt.');
  }
  await ReceiptLine.destroy({ where: { id: lineId, receipt_id: receiptId } });
}

export async function updateLineReceivedQty(receiptId: number, lineId: number, qty_received: number) {
  const receipt = await getReceipt(receiptId);
  if (receipt.status === 'done' || receipt.status === 'canceled') {
    throw Errors.businessRule('Cannot modify lines on a completed or canceled receipt.');
  }
  const line = await ReceiptLine.findOne({ where: { id: lineId, receipt_id: receiptId } });
  if (!line) throw Errors.notFound('ReceiptLine');
  
  line.qty_received = qty_received;
  await line.save();
  return line;
}

export async function validateReceipt(id: number, userId: number) {
  const receipt = await getReceipt(id);
  if (receipt.status !== 'draft' && receipt.status !== 'ready') {
    throw Errors.businessRule('Only draft or ready receipts can be validated.');
  }
  
  const lines = receipt.get('lines') as ReceiptLine[];
  if (!lines || lines.length === 0) {
    throw Errors.businessRule('Cannot validate a receipt with no lines.');
  }

  const movementLines = lines.map(l => ({
    productId: l.product_id,
    qty: l.qty_received,
    unitCost: l.unit_cost
  })).filter(l => l.qty > 0);

  // Note: if destination_location_id is null, stock engine needs a location. 
  // In a real system, it would fall back to the warehouse's default receive location.
  // We'll throw an error if no location is specified.
  if (!receipt.destination_location_id) {
    throw Errors.businessRule('Destination location is required before validating.');
  }

  await sequelize.transaction(async (tx) => {
    // 1. Call stock engine
    if (movementLines.length > 0) {
      await applyReceipt(
        receipt.destination_location_id!,
        movementLines,
        {
          documentId: receipt.id,
          documentType: 'receipt',
          documentReference: receipt.reference,
          performedBy: userId
        },
        tx
      );
    }
    
    // 2. Mark done
    receipt.status = 'done';
    receipt.completed_at = new Date();
    await receipt.save({ transaction: tx });
  });

  return receipt;
}
