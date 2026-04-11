const express = require('express');
const User = require('../models/User');
const Message = require('../models/Message'); // 🔥 NEW: Need this to count messages
const Conversation = require('../models/Conversation'); // 🔥 NEW: Need this to find the chat room
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// ==========================================
// 1. GET MY PRIVATE CONTACTS (With Unread Count)
// ==========================================
router.get('/contacts', authMiddleware, async (req, res) => {
    try {
        const loggedInUserId = req.user.userId;
        
        // Fetch user and populate their contacts
        const user = await User.findById(loggedInUserId).populate('contacts', 'name username email profilePic bio isOnline lastSeen');
        
        // 🔥 NEW: Map through contacts and calculate unread messages for each
        const contactsWithUnreadCount = await Promise.all(user.contacts.map(async (contact) => {
            // Find conversation between logged-in user and this contact
            const conversation = await Conversation.findOne({
                participants: { $all: [loggedInUserId, contact._id] }
            });

            let unreadCount = 0;
            if (conversation) {
                // Count messages sent by them, which are NOT read, and not deleted by me
                unreadCount = await Message.countDocuments({
                    conversationId: conversation._id,
                    sender: contact._id,
                    status: { $ne: 'read' },
                    deletedBy: { $ne: loggedInUserId }
                });
            }

            // Return contact details merged with the unread count
            return {
                ...contact.toObject(),
                unreadCount
            };
        }));

        res.status(200).json(contactsWithUnreadCount);
    } catch (error) {
        console.error("Error fetching contacts:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// ==========================================
// 2. ADD A NEW CONTACT
// ==========================================
router.post('/add-contact', authMiddleware, async (req, res) => {
    try {
        const { searchQuery } = req.body; 
        const loggedInUserId = req.user.userId;

        const loggedInUser = await User.findById(loggedInUserId);
        
        const contactToAdd = await User.findOne({ 
            $or: [
                { email: searchQuery.toLowerCase() }, 
                { username: searchQuery.toLowerCase() }
            ] 
        });

        if (!contactToAdd) {
            return res.status(404).json({ message: "No user found with this Username or Email." });
        }

        if (contactToAdd._id.toString() === loggedInUser._id.toString()) {
            return res.status(400).json({ message: "You cannot add yourself." });
        }

        if (loggedInUser.contacts.includes(contactToAdd._id)) {
            return res.status(400).json({ message: "User is already in your contact list." });
        }

        loggedInUser.contacts.push(contactToAdd._id);
        await loggedInUser.save();

        contactToAdd.contacts.push(loggedInUser._id);
        await contactToAdd.save();

        res.status(200).json({ 
            message: "Contact added successfully", 
            contact: {
                _id: contactToAdd._id,
                name: contactToAdd.name,
                username: contactToAdd.username,
                profilePic: contactToAdd.profilePic,
                bio: contactToAdd.bio,
                isOnline: contactToAdd.isOnline,
                lastSeen: contactToAdd.lastSeen,
                unreadCount: 0 // New contact starts with 0 unread
            }
        });
    } catch (error) {
        console.error("Error adding contact:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// ==========================================
// 3. UPDATE USER PROFILE
// ==========================================
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const { profilePic, dob, country, bio } = req.body;
        
        const updatedUser = await User.findByIdAndUpdate(
            req.user.userId,
            { profilePic, dob, country, bio },
            { new: true } 
        ).select('-password'); 

        res.status(200).json({ 
            message: "Profile updated successfully", 
            user: updatedUser 
        });
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// ==========================================
// 4. GET LOGGED IN USER DETAILS
// ==========================================
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        res.status(200).json(user);
    } catch (error) {
        console.error("Error fetching user data:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;