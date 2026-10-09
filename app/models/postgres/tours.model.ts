import { DataTypes } from "sequelize";
import dbConfig from "../../../config/database.config";

const Tour = dbConfig.postgres.define("tour", {
  id: { type: DataTypes.STRING(64), primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  plan: DataTypes.STRING,
  description: DataTypes.TEXT,
  plan_start_date: DataTypes.DATE,
  plan_end_date: DataTypes.DATE,
  status: { type: DataTypes.BOOLEAN, defaultValue: true },
  _id: { type: DataTypes.VIRTUAL, get(this: any) { return this.getDataValue("id"); } },
}, { tableName: "tours", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" });
export default Tour;
