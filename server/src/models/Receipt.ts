import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import { Warehouse } from './Warehouse';
import { Location } from './Location';
import { Contact } from './Contact';
import { User } from './User';

export class Receipt extends Model {
  public id!: number;
  public reference!: string;
  public warehouse_id!: number;
  public destination_location_id!: number | null;
  public contact_id!: number | null;
  public responsible_user_id!: number;
  public status!: 'draft' | 'ready' | 'done' | 'canceled';
  public scheduled_date!: Date | null;
  public completed_at!: Date | null;
  public notes!: string | null;
}

Receipt.init(
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    reference: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    warehouse_id: { type: DataTypes.BIGINT, allowNull: false },
    destination_location_id: { type: DataTypes.BIGINT, allowNull: true },
    contact_id: { type: DataTypes.BIGINT, allowNull: true },
    responsible_user_id: { type: DataTypes.BIGINT, allowNull: false },
    status: { type: DataTypes.ENUM('draft', 'ready', 'done', 'canceled'), allowNull: false, defaultValue: 'draft' },
    scheduled_date: { type: DataTypes.DATEONLY, allowNull: true },
    completed_at: { type: DataTypes.DATE, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    tableName: 'receipts',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);
