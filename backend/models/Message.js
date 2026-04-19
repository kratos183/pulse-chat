const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    content: {
      type: String,
      default: "",
    },
    attachments: [
      {
        type: String, // URLs to cloud storage
      },
    ],
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    tempId: {
      type: String, // Client-generated UUID for optimistic UI reconciliation
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
