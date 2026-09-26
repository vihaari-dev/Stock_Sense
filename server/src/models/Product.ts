import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export class Product extends Model {
  declare id: number;
  declare sku: string;
  declare name: string;
  declare description: string | null;
  declare category_id: number;
  declare uom_id: number;
  declare unit_cost: number;
  declare reorder_point: number;
  declare reorder_qty: number;
  declare is_active: boolean;
  declare created_at: Date;
  declare updated_at: Date;
}

Product.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    sku: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    category_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    uom_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    unit_cost: {
      type: DataTypes.DECIMAL(12, 4),
      allowNull: false,
      defaultValue: 0.0,
    },
    reorder_point: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    reorder_qty: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    is_active: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
    },
  },
  {
    sequelize,
    tableName: 'products',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);
