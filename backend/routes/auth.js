const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios'); // 🔥 Axios for Brevo API
const User = require('../models/User');
const Otp = require('../models/Otp');
const router = express.Router();

// ==========================================
// 1. SEND OTP API (Via BREVO API)
// ==========================================
router.post('/send-otp', async (req, res) => {
    console.log("🚀 Frontend request received for:", req.body.identifier);
    
    try {
        const { identifier, type } = req.body; // type: 'register' or 'forgot'
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        const existingUser = await User.findOne({ email: identifier });
        if (type === 'register' && existingUser) return res.status(400).json({ message: "Email already registered" });
        if (type === 'forgot' && !existingUser) return res.status(404).json({ message: "User not found" });

        await Otp.deleteMany({ identifier });
        await Otp.create({ identifier, otp });

        // 🔥 BREVO API CALL (Bypasses Render SMTP Block)
        await axios.post('https://api.brevo.com/v3/smtp/email', {
            sender: { name: "NexusChat Premium", email: process.env.EMAIL_USER },
            to: [{ email: identifier }],
            subject: "NexusChat - Your Security Code",
            htmlContent: `
                <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center; background-color: #f8fafc;">
                    <h2 style="color: #1e3a8a;">NexusChat Security</h2>
                    <p>Your verification code is:</p>
                    <h1 style="background: #1e3a8a; color: white; padding: 10px 20px; display: inline-block; border-radius: 10px; letter-spacing: 5px;">${otp}</h1>
                    <p style="color: #64748b; font-size: 12px;">This code will expire in 5 minutes.</p>
                </div>`
        }, {
            headers: {
                'accept': 'application/json',
                'api-key': process.env.BREVO_API_KEY,
                'content-type': 'application/json'
            }
        });

        res.status(200).json({ message: "OTP sent successfully!" });
    } catch (error) { 
        console.error("🔥 BREVO API ERROR:", error.response ? error.response.data : error.message);
        res.status(500).json({ message: "Failed to send OTP" }); 
    }
});

// ==========================================
// 2. FINAL REGISTER
// ==========================================
router.post('/register', async (req, res) => {
    try {
        const { name, username, identifier, password, otp } = req.body;
        const validOtp = await Otp.findOne({ identifier, otp });
        if (!validOtp) return res.status(400).json({ message: "Invalid or expired OTP" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, username, email: identifier, password: hashedPassword });
        await newUser.save();
        await Otp.deleteOne({ identifier });

        const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ token, userId: newUser._id });
    } catch (error) { res.status(500).json({ message: "Username already taken" }); }
});

// ==========================================
// 3. RESET PASSWORD
// ==========================================
router.post('/reset-password', async (req, res) => {
    try {
        const { identifier, otp, newPassword } = req.body;
        const validOtp = await Otp.findOne({ identifier, otp });
        if (!validOtp) return res.status(400).json({ message: "Invalid OTP" });

        const user = await User.findOne({ email: identifier });
        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        await Otp.deleteOne({ identifier });

        res.status(200).json({ message: "Password reset successful", username: user.username });
    } catch (error) { res.status(500).json({ message: "Failed to reset password" }); }
});

// ==========================================
// 4. LOGIN
// ==========================================
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ $or: [{ email }, { username: email }] });
        if (!user || !(await bcrypt.compare(password, user.password))) 
            return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.status(200).json({ token, userId: user._id });
    } catch (error) { res.status(500).json({ message: "Login error" }); }
});

module.exports = router;