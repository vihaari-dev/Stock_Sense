import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class Category extends Model {
  public id!: number;
  public name!: string;
  public parent_id!: number | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Category.init(
  {
    id:        { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    name:      { type: DataTypes.STRING(100), allowNull: false, unique: true },
    parent_id: { type: DataTypes.BIGINT, allowNull: true, defaultValue: null },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: 'categories',
    timestamps: false,
  }
);
