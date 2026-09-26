import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class Contact extends Model {
  public id!: number;
  public name!: string;
  public email!: string | null;
  public phone!: string | null;
  public type!: 'supplier' | 'customer' | 'other';
}

Contact.init(
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(150), allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: true },
    phone: { type: DataTypes.STRING(30), allowNull: true },
    type: { type: DataTypes.ENUM('supplier', 'customer', 'other'), allowNull: false, defaultValue: 'other' },
  },
  {
    sequelize,
    tableName: 'contacts',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);
