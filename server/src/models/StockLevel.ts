import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export class StockLevel extends Model {
  declare id: number;
  declare product_id: number;
  declare location_id: number;
  declare on_hand: number;
  declare reserved: number;
  declare created_at: Date;
  declare updated_at: Date;
}

StockLevel.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    product_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    location_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    on_hand: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    reserved: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'stock_levels',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);
