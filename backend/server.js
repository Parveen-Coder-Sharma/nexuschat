const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Required imports for Socket.io integration
const http = require('http');
const { Server } = require('socket.io');

// Import Models
const User = require('./models/User'); 
const Message = require('./models/Message'); 

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/user'));
app.use('/api/messages', require('./routes/message'));
app.use('/api/groups', require('./routes/group')); // 🔥 NEW: Group Route Added Here

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Atlas Connected Successfully!"))
    .catch((err) => console.log("❌ MongoDB Connection Error: ", err));

// ==========================================
// REAL-TIME ENGINE (Socket.io) SETUP
// ==========================================
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

io.on("connection", (socket) => {
    console.log(`🔌 New Connection: ${socket.id}`);

    socket.on("user_connected", async (userId) => {
        socket.userId = userId; 
        await User.findByIdAndUpdate(userId, { isOnline: true });
        io.emit("user_status_update", { userId, isOnline: true });
    });

    // Room ID can now be a 1-on-1 ID OR a Group _id
    socket.on("join_room", (roomId) => { socket.join(roomId); });

    socket.on("send_message", (data) => {
        socket.to(data.roomId).emit("receive_message", data); 
    });

    socket.on("mark_as_read", async ({ messageId, roomId }) => {
        try {
            await Message.findByIdAndUpdate(messageId, { status: 'read' });
            io.to(roomId).emit("message_read_update", { messageId, status: 'read' });
        } catch (error) {}
    });

    socket.on("delete_message", ({ messageId, roomId }) => { io.to(roomId).emit("message_deleted_update", messageId); });
    socket.on("clear_chat", ({ roomId }) => { io.to(roomId).emit("chat_cleared_update"); });

    socket.on("typing", ({ roomId, userId }) => { socket.to(roomId).emit("user_typing", { userId }); });
    socket.on("stop_typing", ({ roomId, userId }) => { socket.to(roomId).emit("user_stopped_typing", { userId }); });

    // CALL SIGNALING
    socket.on("cancel_call", ({ roomId }) => { socket.to(roomId).emit("call_cancelled"); });
    socket.on("reject_call", ({ roomId }) => { socket.to(roomId).emit("call_rejected"); });
    socket.on("end_call", ({ roomId }) => { socket.to(roomId).emit("call_ended"); });

    socket.on("disconnect", async () => {
        if (socket.userId) {
            const currentTime = new Date();
            await User.findByIdAndUpdate(socket.userId, { isOnline: false, lastSeen: currentTime });
            io.emit("user_status_update", { userId: socket.userId, isOnline: false, lastSeen: currentTime });
        }
    });
});

app.get('/', (req, res) => { res.send("🚀 NexusChat Backend is Live!"); });

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => { console.log(`✅ Server and Socket.io are running on PORT ${PORT}`); });