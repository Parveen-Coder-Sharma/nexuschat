const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// ==========================================
// REGISTER
// ==========================================
router.post('/register', async (req, res) => {
    try {
        const { name, username, email, password } = req.body;

        // Check if email or username already exists
        const existingUser = await User.findOne({ 
            $or: [{ email: email }, { username: username }] 
        });

        if (existingUser) {
            if (existingUser.email === email) {
                return res.status(400).json({ message: "Email is already registered." });
            }
            if (existingUser.username === username) {
                return res.status(400).json({ message: "Username is already taken." });
            }
        }

        // Hash password and save user
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            name,
            username,
            email,
            password: hashedPassword
        });

        await newUser.save();
        res.status(201).json({ message: "User registered successfully." });

    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// ==========================================
// LOGIN (Accepts Email OR Username)
// ==========================================
router.post('/login', async (req, res) => {
    try {
        const { identifier, password } = req.body;

        // Find user by either email or username
        const user = await User.findOne({ 
            $or: [{ email: identifier }, { username: identifier }] 
        });

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials." });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secretkey', { expiresIn: '7d' });

        res.status(200).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;