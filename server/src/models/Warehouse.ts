import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export class Warehouse extends Model {
  declare id: number;
  declare name: string;
  declare code: string;
  declare address: string | null;
  declare is_active: boolean;
  declare created_at: Date;
  declare updated_at: Date;
}

Warehouse.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
    },
  },
  {
    sequelize,
    tableName: 'warehouses',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);
