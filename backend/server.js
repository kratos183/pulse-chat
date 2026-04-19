const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");
const User = require("./models/User");

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// CORS origins — production + development
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:3000",
  "http://localhost:3001",
].filter(Boolean);

// Socket.io setup
const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

// ─── Middleware ──────────────────────────────────────────────
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { message: "Too many requests, please try again later" },
});
app.use("/api/", apiLimiter);

// ─── Routes ─────────────────────────────────────────────────
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/chats", require("./routes/chatRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));

// Health check
app.get("/", (req, res) => {
  res.json({ status: "Chat API is running 🚀" });
});

// ─── Socket.io Logic ────────────────────────────────────────
// Track connected users: { visibleUserId: socketId }
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // Setup: User joins their personal room
  socket.on("setup", async (userData) => {
    if (!userData?._id) return;

    socket.userId = userData._id;
    socket.join(userData._id);
    onlineUsers.set(userData._id, socket.id);

    // Update DB online status
    await User.findByIdAndUpdate(userData._id, { isOnline: true });

    // Broadcast online status to all connected users
    io.emit("user_online", {
      userId: userData._id,
      isOnline: true,
    });

    // Send current online users list to the connecting user
    socket.emit("online_users", Array.from(onlineUsers.keys()));

    console.log(`✅ User ${userData._id} is now online`);
  });

  // Join a specific chat room
  socket.on("join_chat", (chatId) => {
    socket.join(chatId);
    console.log(`📌 User joined chat: ${chatId}`);
  });

  // Leave a chat room
  socket.on("leave_chat", (chatId) => {
    socket.leave(chatId);
  });

  // Typing indicators
  socket.on("typing", ({ chatId, userId, userName }) => {
    socket.to(chatId).emit("typing", { chatId, userId, userName });
  });

  socket.on("stop_typing", ({ chatId, userId }) => {
    socket.to(chatId).emit("stop_typing", { chatId, userId });
  });

  // New message
  socket.on("new_message", (message) => {
    const chat = message.chat;
    if (!chat || !chat.users) return;

    // Emit to all users in the chat except the sender
    chat.users.forEach((user) => {
      if (user._id === message.sender._id) return;
      socket.to(user._id).emit("message_received", message);
    });
  });

  // Read receipts
  socket.on("message_read", ({ chatId, userId }) => {
    socket.to(chatId).emit("message_read", { chatId, userId });
  });

  // Disconnect
  socket.on("disconnect", async () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);

      await User.findByIdAndUpdate(socket.userId, {
        isOnline: false,
        lastSeen: new Date(),
      });

      io.emit("user_online", {
        userId: socket.userId,
        isOnline: false,
      });

      console.log(`❌ User ${socket.userId} disconnected`);
    }
  });
});

// ─── Start Server ───────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io ready for connections`);
});
