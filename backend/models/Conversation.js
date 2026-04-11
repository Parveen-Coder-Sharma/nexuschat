const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    // 1-on-1 ya Group dono ke participants yahan aayenge
    participants: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }],
    
    // 🔥 NEW: Group Chat Fields
    isGroup: { 
        type: Boolean, 
        default: false 
    },
    groupName: { 
        type: String, 
        default: "" 
    },
    groupAdmin: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    groupIcon: { 
        type: String, 
        default: "https://cdn-icons-png.flaticon.com/512/615/615075.png" // Default group icon
    },
    
    lastMessage: { 
        type: String, 
        default: "" 
    }
}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);