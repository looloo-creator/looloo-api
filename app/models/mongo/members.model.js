const mongoose = require('mongoose');

const MemberSchema = mongoose.Schema({
    user_id: Number,
    tour_id: String,
    name: String,
    status: Boolean
}, {
    timestamps: true
});

module.exports = mongoose.model('Tour_member', MemberSchema);
