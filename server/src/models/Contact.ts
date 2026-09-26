import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export class Contact extends Model {
  public id!: number;
  public name!: string;
  public email!: string | null;
  public phone!: string | null;
  public address!: string | null;
  public type!: 'supplier' | 'customer' | 'other';
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Contact.init(
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
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM('supplier', 'customer', 'other'),
      allowNull: false,
      defaultValue: 'other',
    },
  },
  {
    sequelize,
    tableName: 'contacts',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);
