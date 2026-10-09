import { DataTypes } from "sequelize";
import dbConfig from "../../../config/database.config";

const Account = dbConfig.postgres.define("account", {
  id: { type: DataTypes.STRING(64), primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  tour_id: { type: DataTypes.STRING(64), allowNull: false },
  type: DataTypes.STRING,
  date: DataTypes.DATE,
  collected_from: DataTypes.STRING,
  amount: DataTypes.DECIMAL(14, 2),
  reason: DataTypes.TEXT,
  members: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
  file: DataTypes.STRING,
  status: { type: DataTypes.BOOLEAN, defaultValue: true },
  fileName: DataTypes.STRING,
  _id: { type: DataTypes.VIRTUAL, get(this: any) { return this.getDataValue("id"); } },
}, { tableName: "accounts", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" });
export default Account;
