export interface ReceiptRow {
  id: number;
  reference: string;
  warehouse_id: number;
  destination_location_id: number | null;
  contact_id: number | null;
  responsible_user_id: number;
  status: 'draft' | 'ready' | 'done' | 'canceled';
  scheduled_date: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReceiptLineRow {
  id: number;
  receipt_id: number;
  product_id: number;
  qty_expected: number;
  qty_received: number;
  unit_cost: number;
}

export interface ReceiptDetail extends ReceiptRow {
  lines: ReceiptLineRow[];
}
