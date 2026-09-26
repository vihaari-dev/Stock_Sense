export * from './User';
export * from './RefreshToken';
export * from './OtpCode';
export * from './Category';
export * from './Contact';
export * from './Warehouse';
export * from './Location';
export * from './Product';
export * from './Receipt';
export * from './ReceiptLine';

import { Receipt } from './Receipt';
import { ReceiptLine } from './ReceiptLine';

Receipt.hasMany(ReceiptLine, { foreignKey: 'receipt_id', as: 'lines' });
ReceiptLine.belongsTo(Receipt, { foreignKey: 'receipt_id' });
export * from './Warehouse';
