const mongoose = require('mongoose');

const AccountSchema = mongoose.Schema({
    user_id: String,
    tour_id: String,
    type: String,
    date: Date,
    collected_from: String,
    amount: Number,
    reason: String,
    members: Array,
    status: Boolean
}, {
    timestamps: true
});

module.exports = mongoose.model('Account', AccountSchema);
