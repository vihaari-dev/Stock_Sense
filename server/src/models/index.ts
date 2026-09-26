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
export * from './Product';
export * from './Location';
export * from './Contact';
export * from './Delivery';
export * from './DeliveryLine';

import { User } from './User';
import { RefreshToken } from './RefreshToken';
import { OtpCode } from './OtpCode';
import { Category } from './Category';
import { Warehouse } from './Warehouse';
import { Product } from './Product';
import { Location } from './Location';
import { Contact } from './Contact';
import { Delivery } from './Delivery';
import { DeliveryLine } from './DeliveryLine';

// Identity associations
User.hasMany(RefreshToken, { foreignKey: 'user_id' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(OtpCode, { foreignKey: 'user_id' });
OtpCode.belongsTo(User, { foreignKey: 'user_id' });

// Master Data associations
Category.hasMany(Product, { foreignKey: 'category_id' });
Product.belongsTo(Category, { foreignKey: 'category_id' });

Warehouse.hasMany(Location, { foreignKey: 'warehouse_id' });
Location.belongsTo(Warehouse, { foreignKey: 'warehouse_id' });

// Delivery associations
Warehouse.hasMany(Delivery, { foreignKey: 'warehouse_id' });
Delivery.belongsTo(Warehouse, { foreignKey: 'warehouse_id' });

Location.hasMany(Delivery, { foreignKey: 'source_location_id' });
Delivery.belongsTo(Location, { foreignKey: 'source_location_id' });

Contact.hasMany(Delivery, { foreignKey: 'contact_id' });
Delivery.belongsTo(Contact, { foreignKey: 'contact_id' });

User.hasMany(Delivery, { foreignKey: 'responsible_user_id' });
Delivery.belongsTo(User, { foreignKey: 'responsible_user_id' });

Delivery.hasMany(DeliveryLine, { foreignKey: 'delivery_id', as: 'lines' });
DeliveryLine.belongsTo(Delivery, { foreignKey: 'delivery_id' });

Product.hasMany(DeliveryLine, { foreignKey: 'product_id' });
DeliveryLine.belongsTo(Product, { foreignKey: 'product_id' });

