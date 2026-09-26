import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export class UnitOfMeasure extends Model {
  declare id: number;
  declare name: string;
  declare abbreviation: string;
  declare created_at: Date;
}

UnitOfMeasure.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    abbreviation: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
    },
  },
  {
    sequelize,
    tableName: 'units_of_measure',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);
