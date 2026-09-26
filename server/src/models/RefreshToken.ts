import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';

export class RefreshToken extends Model {
  public id!: number;
  public user_id!: number;
  public token_hash!: string;
  public expires_at!: Date;
  public revoked_at!: Date | null;
  public readonly created_at!: Date;
}

RefreshToken.init(
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.BIGINT, allowNull: false },
    token_hash: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    revoked_at: { type: DataTypes.DATE, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: 'refresh_tokens',
    timestamps: false,
  }
);

RefreshToken.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(RefreshToken, { foreignKey: 'user_id' });
