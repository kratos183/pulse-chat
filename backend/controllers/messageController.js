const Message = require("../models/Message");
const Chat = require("../models/Chat");
const cloudinary = require("../config/cloudinary");
const { Readable } = require("stream");

// Helper: upload buffer to Cloudinary
const uploadToCloudinary = (buffer, folder = "chat_attachments") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "auto" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
};

// @desc    Send a message
// @route   POST /api/messages
const sendMessage = async (req, res) => {
  try {
    const { content, chatId, tempId } = req.body;

    if (!chatId) {
      return res.status(400).json({ message: "chatId is required" });
    }

    if (!content && (!req.files || req.files.length === 0)) {
      return res.status(400).json({ message: "Message content or file is required" });
    }

    // Handle file uploads
    let attachmentUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const result = await uploadToCloudinary(file.buffer);
          attachmentUrls.push(result.secure_url);
        } catch (uploadErr) {
          console.error("Cloudinary upload failed:", uploadErr.message);
          // Continue without the failed upload
        }
      }
    }

    const messageData = {
      sender: req.user._id,
      chat: chatId,
      content: content || "",
      attachments: attachmentUrls,
      readBy: [req.user._id], // Sender has read their own message
    };

    if (tempId) {
      messageData.tempId = tempId;
    }

    let message = await Message.create(messageData);

    // Populate the message
    message = await Message.findById(message._id)
      .populate("sender", "name email avatarUrl")
      .populate({
        path: "chat",
        populate: { path: "users", select: "name email avatarUrl" },
      });

    // Update latest message in the chat
    await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all messages for a chat (with pagination)
// @route   GET /api/messages/:chatId?page=1&limit=30
const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip = (page - 1) * limit;

    // Verify user is part of this chat
    const chat = await Chat.findOne({
      _id: chatId,
      users: { $elemMatch: { $eq: req.user._id } },
    });

    if (!chat) {
      return res.status(403).json({ message: "Not authorized to view this chat" });
    }

    const totalMessages = await Message.countDocuments({ chat: chatId });

    const messages = await Message.find({ chat: chatId })
      .populate("sender", "name email avatarUrl")
      .populate("readBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Return in chronological order
    messages.reverse();

    res.json({
      messages,
      pagination: {
        page,
        limit,
        totalMessages,
        totalPages: Math.ceil(totalMessages / limit),
        hasMore: page * limit < totalMessages,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark messages as read
// @route   PUT /api/messages/read/:chatId
const markAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;

    await Message.updateMany(
      {
        chat: chatId,
        readBy: { $ne: req.user._id },
      },
      {
        $addToSet: { readBy: req.user._id },
      }
    );

    res.json({ message: "Messages marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { sendMessage, getMessages, markAsRead };
