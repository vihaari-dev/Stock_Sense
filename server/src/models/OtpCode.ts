import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';

export class OtpCode extends Model {
  public id!: number;
  public user_id!: number;
  public code_hash!: string;
  public expires_at!: Date;
  public used_at!: Date | null;
  public readonly created_at!: Date;
}

OtpCode.init(
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.BIGINT, allowNull: false },
    code_hash: { type: DataTypes.STRING(255), allowNull: false },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    used_at: { type: DataTypes.DATE, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: 'otp_codes',
    timestamps: false,
  }
);

OtpCode.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(OtpCode, { foreignKey: 'user_id' });
