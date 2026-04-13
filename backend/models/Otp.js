const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    identifier: { type: String, required: true }, // User ka email
    otp: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 300 } // 5 min mein auto-delete
});

module.exports = mongoose.model('Otp', otpSchema);