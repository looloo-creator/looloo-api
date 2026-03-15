import mongoose, { Schema } from "mongoose";

const MemberSchema = new Schema(
  {
    user_id: Number,
    tour_id: String,
    name: String,
    status: Boolean,
  },
  {
    timestamps: true,
  }
);

const Member = mongoose.model("Tour_member", MemberSchema);

export default Member;
// CommonJS compatibility
module.exports = Member;
