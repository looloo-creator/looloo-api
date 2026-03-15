import { DataTypes } from "sequelize";
import dbConfig from "../../../config/database.config";

const db = dbConfig.mysql;

const UserModel = db.define(
  "user",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    email: { type: DataTypes.STRING },
    username: { type: DataTypes.STRING },
    password: { type: DataTypes.STRING },
    is_email_verified: { type: DataTypes.INTEGER },
    email_verified_at: { type: DataTypes.DATE },
    email_token: { type: DataTypes.STRING },
    refresh_token: { type: DataTypes.STRING },
    status: { type: DataTypes.INTEGER },
    last_login: { type: DataTypes.DATE },
    is_active: { type: DataTypes.INTEGER },
  },
  {
    freezeTableName: false,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default UserModel;
// Ensure CommonJS compatibility where required()
module.exports = UserModel;
