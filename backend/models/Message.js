const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    audioUrl: { type: String, default: "" },
    videoUrl: { type: String, default: "" },       
    documentUrl: { type: String, default: "" },    
    documentName: { type: String, default: "" },   
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
    isForwarded: { type: Boolean, default: false },
    reactions: [{
        emoji: String,
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }],
    // 🔥 NEW: Link Preview Metadata Storage
    linkPreview: {
        title: { type: String, default: "" },
        description: { type: String, default: "" },
        image: { type: String, default: "" },
        url: { type: String, default: "" }
    },
    status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
    deletedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);