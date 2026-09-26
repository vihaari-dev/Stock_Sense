import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class ReceiptLine extends Model {
  public id!: number;
  public receipt_id!: number;
  public product_id!: number;
  public qty_expected!: number;
  public qty_received!: number;
  public unit_cost!: number;
}

ReceiptLine.init(
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    receipt_id: { type: DataTypes.BIGINT, allowNull: false },
    product_id: { type: DataTypes.BIGINT, allowNull: false },
    qty_expected: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    qty_received: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    unit_cost: { type: DataTypes.DECIMAL(12, 4), allowNull: false },
  },
  {
    sequelize,
    tableName: 'receipt_lines',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);
