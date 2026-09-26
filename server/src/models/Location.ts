import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import { Warehouse } from './Warehouse';

export class Location extends Model {
  public id!: number;
  public warehouse_id!: number;
  public name!: string;
  public code!: string;
  public is_active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Location.init(
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    warehouse_id: { type: DataTypes.BIGINT, allowNull: false },
    name: { type: DataTypes.STRING(150), allowNull: false },
    code: { type: DataTypes.STRING(20), allowNull: false },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: 'locations',
    timestamps: false,
  }
);

Location.belongsTo(Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse' });
Warehouse.hasMany(Location, { foreignKey: 'warehouse_id', as: 'locations' });
