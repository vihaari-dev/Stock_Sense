import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export class Location extends Model {
  declare id: number;
  declare warehouse_id: number;
  declare name: string;
  declare code: string;
  declare is_active: boolean;
  declare created_at: Date;
  declare updated_at: Date;
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
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
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
