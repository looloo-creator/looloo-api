import mongoose, { Schema } from "mongoose";

const AccountSchema = new Schema(
  {
    user_id: String,
    tour_id: String,
    type: String,
    date: Date,
    collected_from: String,
    amount: Number,
    reason: String,
    members: Array,
    file: String,
    status: Boolean,
    fileName: String,
  },
  {
    timestamps: true,
  }
);

const Account = mongoose.model("Account", AccountSchema);

export default Account;
// CommonJS compatibility
module.exports = Account;
