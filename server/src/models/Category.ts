import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export class Category extends Model {
  declare id: number;
  declare name: string;
  declare parent_id: number | null;
  declare created_at: Date;
  declare updated_at: Date;
}

Category.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    parent_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'categories',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);
