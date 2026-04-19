const Chat = require("../models/Chat");
const User = require("../models/User");

// @desc    Create or access a 1-on-1 chat
// @route   POST /api/chats
const accessChat = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "UserId is required" });
    }

    // Check if 1-on-1 chat already exists
    let chat = await Chat.find({
      isGroupChat: false,
      $and: [
        { users: { $elemMatch: { $eq: req.user._id } } },
        { users: { $elemMatch: { $eq: userId } } },
      ],
    })
      .populate("users", "-password")
      .populate({
        path: "latestMessage",
        populate: { path: "sender", select: "name email avatarUrl" },
      });

    if (chat.length > 0) {
      return res.json(chat[0]);
    }

    // Create new 1-on-1 chat
    const newChat = await Chat.create({
      chatName: "Direct Message",
      isGroupChat: false,
      users: [req.user._id, userId],
    });

    const fullChat = await Chat.findById(newChat._id).populate(
      "users",
      "-password"
    );

    res.status(201).json(fullChat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all chats for logged-in user
// @route   GET /api/chats
const fetchChats = async (req, res) => {
  try {
    const chats = await Chat.find({
      users: { $elemMatch: { $eq: req.user._id } },
    })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate({
        path: "latestMessage",
        populate: { path: "sender", select: "name email avatarUrl" },
      })
      .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a group chat
// @route   POST /api/chats/group
const createGroupChat = async (req, res) => {
  try {
    const { name, users } = req.body;

    if (!name || !users) {
      return res
        .status(400)
        .json({ message: "Group name and users are required" });
    }

    let userIds = typeof users === "string" ? JSON.parse(users) : users;

    if (userIds.length < 2) {
      return res
        .status(400)
        .json({ message: "A group needs at least 3 members (including you)" });
    }

    // Add current user to the group
    userIds.push(req.user._id);

    const groupChat = await Chat.create({
      chatName: name,
      isGroupChat: true,
      users: userIds,
      groupAdmin: req.user._id,
    });

    const fullChat = await Chat.findById(groupChat._id)
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.status(201).json(fullChat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add user to group
// @route   PUT /api/chats/group/add
const addToGroup = async (req, res) => {
  try {
    const { chatId, userId } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    if (chat.groupAdmin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only admin can add members" });
    }

    if (chat.users.includes(userId)) {
      return res.status(400).json({ message: "User already in group" });
    }

    const updated = await Chat.findByIdAndUpdate(
      chatId,
      { $push: { users: userId } },
      { new: true }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove user from group
// @route   PUT /api/chats/group/remove
const removeFromGroup = async (req, res) => {
  try {
    const { chatId, userId } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Only admin can remove, or user can remove themselves
    if (
      chat.groupAdmin.toString() !== req.user._id.toString() &&
      userId !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Only admin can remove members" });
    }

    const updated = await Chat.findByIdAndUpdate(
      chatId,
      { $pull: { users: userId } },
      { new: true }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  accessChat,
  fetchChats,
  createGroupChat,
  addToGroup,
  removeFromGroup,
};
