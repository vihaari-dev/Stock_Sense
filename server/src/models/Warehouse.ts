import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class Warehouse extends Model {
  public id!: number;
  public name!: string;
  public code!: string;
  public is_active!: boolean;
}

Warehouse.init(
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(150), allowNull: false },
    code: { type: DataTypes.STRING(10), allowNull: false },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    sequelize,
    tableName: 'warehouses',
    timestamps: false,
  }
);
