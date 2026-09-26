import { Request, Response, NextFunction, Router } from 'express';
import { requireAuth, requireRole } from '../middleware/requireAuth';
import * as receiptService from '../services/receiptService';

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const receipts = await receiptService.listReceipts();
    res.json(receipts);
  } catch (err) { next(err); }
});

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const receipt = await receiptService.getReceipt(parseInt(req.params.id, 10));
    res.json(receipt);
  } catch (err) { next(err); }
});

router.post('/', requireAuth, requireRole('inventory_manager', 'warehouse_staff'), async (req, res, next) => {
  try {
    const userId = req.user!.sub; // from requireAuth
    const receipt = await receiptService.createReceipt(req.body, userId);
    res.status(201).json(receipt);
  } catch (err) { next(err); }
});

router.patch('/:id', requireAuth, requireRole('inventory_manager', 'warehouse_staff'), async (req, res, next) => {
  try {
    const receipt = await receiptService.updateReceiptHeader(parseInt(req.params.id, 10), req.body);
    res.json(receipt);
  } catch (err) { next(err); }
});

router.post('/:id/lines', requireAuth, requireRole('inventory_manager', 'warehouse_staff'), async (req, res, next) => {
  try {
    const line = await receiptService.addOrUpdateLine(parseInt(req.params.id, 10), req.body);
    res.status(201).json(line);
  } catch (err) { next(err); }
});

router.patch('/:id/lines/:lineId', requireAuth, requireRole('inventory_manager', 'warehouse_staff'), async (req, res, next) => {
  try {
    const line = await receiptService.updateLineReceivedQty(
      parseInt(req.params.id, 10), 
      parseInt(req.params.lineId, 10), 
      req.body.qty_received
    );
    res.json(line);
  } catch (err) { next(err); }
});

router.delete('/:id/lines/:lineId', requireAuth, requireRole('inventory_manager', 'warehouse_staff'), async (req, res, next) => {
  try {
    await receiptService.removeLine(parseInt(req.params.id, 10), parseInt(req.params.lineId, 10));
    res.status(204).send();
  } catch (err) { next(err); }
});

router.post('/:id/validate', requireAuth, requireRole('inventory_manager'), async (req, res, next) => {
  try {
    const userId = req.user!.sub;
    const receipt = await receiptService.validateReceipt(parseInt(req.params.id, 10), userId);
    res.json(receipt);
  } catch (err) { next(err); }
});

export default router;
