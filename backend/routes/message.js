const express = require('express');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User'); 
const authMiddleware = require('../middleware/authMiddleware');
const { getLinkPreview } = require('link-preview-js'); 

const router = express.Router();

router.post('/send/:targetId', authMiddleware, async (req, res) => {
    try {
        const { text, imageUrl, audioUrl, videoUrl, documentUrl, documentName, replyTo, isForwarded } = req.body; 
        const targetId = req.params.targetId; // Can be a User ID or a Group ID
        const senderId = req.user.userId;

        // 🔥 SMART ROUTING: Check if targetId is an existing Group
        let conversation = await Conversation.findById(targetId);
        let isGroupMessage = false;

        if (conversation && conversation.isGroup) {
            isGroupMessage = true;
            // Verify if sender is part of the group
            if (!conversation.participants.includes(senderId)) {
                return res.status(403).json({ message: "You are not a member of this group" });
            }
        } else {
            // It's a 1-on-1 Chat
            conversation = await Conversation.findOne({ 
                isGroup: false, 
                participants: { $all: [senderId, targetId] } 
            });

            if (!conversation) {
                conversation = await Conversation.create({ 
                    isGroup: false, 
                    participants: [senderId, targetId] 
                });
            }
        }

        // Link Preview Logic
        let previewData = null;
        if (text) {
            const urlRegex = /(https?:\/\/[^\s]+)/g;
            const urls = text.match(urlRegex);
            
            if (urls && urls.length > 0) {
                const targetUrl = urls[0];
                const ytMatch = targetUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})/);
                
                if (ytMatch && ytMatch[1]) {
                    previewData = {
                        title: "YouTube Video", description: targetUrl,
                        image: `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`, url: targetUrl
                    };
                } else {
                    try {
                        const preview = await getLinkPreview(targetUrl, { timeout: 5000, headers: { "User-Agent": "Mozilla/5.0" } });
                        previewData = {
                            title: preview.title || "Link", description: preview.description || targetUrl,
                            image: preview.images && preview.images.length > 0 ? preview.images[0] : "", url: preview.url || targetUrl
                        };
                    } catch (e) { console.log("Link preview failed"); }
                }
            }
        }

        const newMessage = new Message({
            conversationId: conversation._id, sender: senderId,
            text: text || "", imageUrl: imageUrl || "", audioUrl: audioUrl || "",
            videoUrl: videoUrl || "", documentUrl: documentUrl || "", documentName: documentName || "",
            replyTo: replyTo || null, isForwarded: isForwarded || false, 
            linkPreview: previewData, 
            status: isGroupMessage ? 'sent' : 'delivered' // Group msgs don't use single delivered status in this simple logic
        });

        await newMessage.save();

        let lastMsgText = text;
        if (imageUrl) lastMsgText = "📷 Photo";
        if (videoUrl) lastMsgText = "🎥 Video";
        if (audioUrl) lastMsgText = "🎤 Voice Note";
        if (documentUrl) lastMsgText = "📄 Document";
        
        conversation.lastMessage = lastMsgText;
        await conversation.save();

        const populatedMessage = await Message.findById(newMessage._id).populate('replyTo', 'text imageUrl videoUrl audioUrl documentUrl documentName sender').populate('sender', 'name profilePic');
        
        res.status(201).json(populatedMessage);
    } catch (error) { res.status(500).json({ message: "Internal server error" }); }
});

router.get('/:targetId', authMiddleware, async (req, res) => {
    try {
        const targetId = req.params.targetId;
        const loggedInUserId = req.user.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        // 🔥 SMART ROUTING
        let conversation = await Conversation.findById(targetId);
        
        if (!conversation || !conversation.isGroup) {
            conversation = await Conversation.findOne({ 
                isGroup: false, 
                participants: { $all: [loggedInUserId, targetId] } 
            });
        }

        if (!conversation) return res.status(200).json([]);

        const messages = await Message.find({ conversationId: conversation._id, deletedBy: { $ne: loggedInUserId } })
        .sort({ createdAt: -1 }).skip(skip).limit(limit)
        .populate('replyTo', 'text imageUrl videoUrl audioUrl documentUrl documentName sender')
        .populate('sender', 'name profilePic'); // Need sender details for Group Chats

        res.status(200).json(messages.reverse());
    } catch (error) { res.status(500).json({ message: "Internal server error" }); }
});

router.put('/:messageId/react', authMiddleware, async (req, res) => {
    try {
        const { emoji } = req.body;
        const userId = req.user.userId;
        const message = await Message.findById(req.params.messageId);

        if (!message) return res.status(404).json({ message: "Message not found" });

        const existingReactionIndex = message.reactions.findIndex(r => r.userId.toString() === userId);
        if (existingReactionIndex !== -1) {
            if (message.reactions[existingReactionIndex].emoji === emoji) {
                message.reactions.splice(existingReactionIndex, 1);
            } else {
                message.reactions[existingReactionIndex].emoji = emoji;
            }
        } else { message.reactions.push({ emoji, userId }); }

        await message.save();
        const populatedMessage = await Message.findById(message._id).populate('replyTo').populate('sender', 'name profilePic');
        res.status(200).json(populatedMessage);
    } catch (error) { res.status(500).json({ message: "Internal server error" }); }
});

router.delete('/:messageId', authMiddleware, async (req, res) => {
    // Exact same as before
    try {
        const { type } = req.query; 
        const messageId = req.params.messageId;
        const userId = req.user.userId;
        const message = await Message.findById(messageId);
        if (!message) return res.status(404).json({ message: "Not found" });

        if (type === 'everyone') {
            if (message.sender.toString() !== userId) return res.status(403).json({ message: "Not authorized" });
            await Message.findByIdAndDelete(messageId);
            return res.status(200).json({ message: "Deleted for everyone", type: "everyone" });
        } else {
            await Message.findByIdAndUpdate(messageId, { $addToSet: { deletedBy: userId } });
            return res.status(200).json({ message: "Deleted for you", type: "me" });
        }
    } catch (error) { res.status(500).json({ message: "Internal server error" }); }
});

router.delete('/clear/:targetId', authMiddleware, async (req, res) => {
    try {
        const targetId = req.params.targetId;
        const loggedInUserId = req.user.userId;
        
        let conversation = await Conversation.findById(targetId);
        if (!conversation || !conversation.isGroup) {
            conversation = await Conversation.findOne({ isGroup: false, participants: { $all: [loggedInUserId, targetId] } });
        }

        if (conversation) await Message.updateMany({ conversationId: conversation._id }, { $addToSet: { deletedBy: loggedInUserId } });
        res.status(200).json({ message: "Chat cleared successfully" });
    } catch (error) { res.status(500).json({ message: "Internal server error" }); }
});

module.exports = router;