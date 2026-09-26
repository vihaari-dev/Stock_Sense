import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import { Warehouse } from './Warehouse';

export class Location extends Model {
  public id!: number;
  public warehouse_id!: number;
  public name!: string;
  public code!: string;
}

Location.init(
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    warehouse_id: { type: DataTypes.BIGINT, allowNull: false },
    name: { type: DataTypes.STRING(150), allowNull: false },
    code: { type: DataTypes.STRING(30), allowNull: false, unique: true },
  },
  {
    sequelize,
    tableName: 'locations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);
