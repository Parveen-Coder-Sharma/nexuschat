const express = require('express');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// 🔥 1. Create a New Group Chat
router.post('/create', authMiddleware, async (req, res) => {
    try {
        const { groupName, participants } = req.body;
        const adminId = req.user.userId;

        // Group must have a name and at least 2 other members + admin
        if (!groupName || !participants || participants.length < 2) {
            return res.status(400).json({ message: "Group name and at least 2 members are required." });
        }

        // Add admin to the participants list
        const allParticipants = [...participants, adminId];

        const newGroup = await Conversation.create({
            isGroup: true,
            groupName: groupName,
            groupAdmin: adminId,
            participants: allParticipants,
            lastMessage: "Group Created"
        });

        // Populate participants to send back to frontend
        const populatedGroup = await Conversation.findById(newGroup._id).populate('participants', 'name profilePic isOnline lastSeen');

        res.status(201).json(populatedGroup);
    } catch (error) {
        console.error("Error creating group:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// 🔥 2. Get All Groups for the Logged-in User
router.get('/my-groups', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;

        const groups = await Conversation.find({
            isGroup: true,
            participants: { $in: [userId] }
        }).populate('participants', 'name profilePic isOnline lastSeen').sort({ updatedAt: -1 });

        res.status(200).json(groups);
    } catch (error) {
        console.error("Error fetching groups:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;