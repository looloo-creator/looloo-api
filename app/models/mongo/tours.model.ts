import mongoose, { Schema } from "mongoose";

const TourSchema = new Schema(
  {
    user_id: Number,
    plan: String,
    description: String,
    plan_start_date: Date,
    plan_end_date: Date,
    status: Boolean,
  },
  {
    timestamps: true,
  }
);

const Tour = mongoose.model("Tour", TourSchema);

export default Tour;
// CommonJS compatibility
module.exports = Tour;
