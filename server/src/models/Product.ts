import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class Product extends Model {
  public id!: number;
  public sku!: string;
  public name!: string;
  public category_id!: number | null;
  public is_active!: boolean;
  public unit_cost!: number;
}

Product.init(
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    sku: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    category_id: { type: DataTypes.BIGINT, allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    unit_cost: { type: DataTypes.DECIMAL(12, 4), allowNull: false, defaultValue: 0 },
  },
  {
    sequelize,
    tableName: 'products',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);
