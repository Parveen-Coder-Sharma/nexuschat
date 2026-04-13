const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const Otp = require('../models/Otp');
const router = express.Router();

// Nodemailer Config
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

// 1. Send OTP API
router.post('/send-otp', async (req, res) => {
    try {
        const { identifier, type } = req.body; // type: 'register' or 'forgot'
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        const existingUser = await User.findOne({ email: identifier });
        if (type === 'register' && existingUser) return res.status(400).json({ message: "Email already registered" });
        if (type === 'forgot' && !existingUser) return res.status(404).json({ message: "User not found" });

        await Otp.deleteMany({ identifier });
        await Otp.create({ identifier, otp });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: identifier,
            subject: 'NexusChat - Your Security Code',
            html: `<h3>Welcome to NexusChat</h3><p>Your OTP is: <b style="font-size: 20px;">${otp}</b></p>`
        });

        res.status(200).json({ message: "OTP sent successfully!" });
    } catch (error) { res.status(500).json({ message: "Failed to send OTP" }); }
});

// 2. Final Register
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

// 3. Reset Password
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

// 4. Login
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