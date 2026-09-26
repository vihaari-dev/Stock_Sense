import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export class DeliveryLine extends Model {
  public id!: number;
  public delivery_id!: number;
  public product_id!: number;
  public qty_requested!: number;
  public qty_delivered!: number;
  public is_available!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

DeliveryLine.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    delivery_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    product_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    qty_requested: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    qty_delivered: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    is_available: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'delivery_lines',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);
