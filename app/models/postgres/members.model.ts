import { DataTypes } from "sequelize";
import dbConfig from "../../../config/database.config";

const Member = dbConfig.postgres.define("member", {
  id: { type: DataTypes.STRING(64), primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  tour_id: { type: DataTypes.STRING(64), allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.BOOLEAN, defaultValue: true },
  _id: { type: DataTypes.VIRTUAL, get(this: any) { return this.getDataValue("id"); } },
}, { tableName: "tour_members", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" });
export default Member;
