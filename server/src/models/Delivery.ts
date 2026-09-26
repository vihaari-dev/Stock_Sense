import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export class Delivery extends Model {
  public id!: number;
  public reference!: string;
  public warehouse_id!: number;
  public source_location_id!: number | null;
  public contact_id!: number | null;
  public delivery_address!: string | null;
  public responsible_user_id!: number;
  public status!: 'draft' | 'waiting' | 'ready' | 'done' | 'canceled';
  public scheduled_date!: Date | null;
  public completed_at!: Date | null;
  public notes!: string | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Delivery.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    reference: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    warehouse_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    source_location_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    contact_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    delivery_address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    responsible_user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('draft', 'waiting', 'ready', 'done', 'canceled'),
      allowNull: false,
      defaultValue: 'draft',
    },
    scheduled_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'deliveries',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);
