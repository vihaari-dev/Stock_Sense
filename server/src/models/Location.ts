import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

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
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    warehouse_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'locations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);
