const mongoose = require('mongoose');

const TourSchema = mongoose.Schema({
    user_id: Number,
    plan: String,
    description: String,
    plan_start_date: Date,
    plan_end_date: Date,
    status: Boolean
}, {
    timestamps: true
});

module.exports = mongoose.model('Tour', TourSchema);
