"use client";

import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { getChatName, getOtherUser } from "@/lib/utils";
import Avatar from "./Avatar";
import { Phone, Video, MoreVertical, Hash, Users, ArrowLeft } from "lucide-react";

export default function ChatHeader() {
  const { user } = useAuthStore();
  const { selectedChat, selectChat, onlineUsers, typingUsers } = useChatStore();

  if (!selectedChat) return null;

  const chatName = getChatName(selectedChat, user?._id || "");
  const otherUser = getOtherUser(selectedChat, user?._id || "");
  const isOnline = otherUser ? onlineUsers.includes(otherUser._id) : false;
  const typingList = typingUsers[selectedChat._id]?.filter(
    (t) => t.userId !== user?._id
  ) || [];

  let statusText = "";
  if (typingList.length > 0) {
    statusText =
      typingList.length === 1
        ? `${typingList[0].userName} is typing...`
        : `${typingList.length} people typing...`;
  } else if (selectedChat.isGroupChat) {
    statusText = `${selectedChat.users.length} members`;
  } else {
    statusText = isOnline ? "Online" : "Offline";
  }

  return (
    <div
      className="glass"
      style={{
        padding: "12px 24px",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        borderBottom: "1px solid var(--border-color)",
        zIndex: 10,
      }}
    >
      {/* Back button for mobile */}
      <button
        className="back-btn-mobile"
        onClick={() => selectChat(null)}
        style={{
          background: "none",
          border: "none",
          color: "var(--text-secondary)",
          cursor: "pointer",
          padding: "4px",
          display: "none",
          alignItems: "center",
        }}
      >
        <ArrowLeft size={20} />
      </button>

      {selectedChat.isGroupChat ? (
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "var(--gradient-2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Hash size={20} color="white" />
        </div>
      ) : (
        <Avatar
          name={chatName}
          src={otherUser?.avatarUrl}
          size={40}
          isOnline={isOnline}
          showStatus
        />
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <h2
          style={{
            fontSize: "15px",
            fontWeight: "600",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {chatName}
        </h2>
        <p
          style={{
            fontSize: "12px",
            color: typingList.length > 0
              ? "var(--accent)"
              : isOnline
              ? "var(--success)"
              : "var(--text-muted)",
            fontStyle: typingList.length > 0 ? "italic" : "normal",
          }}
        >
          {statusText}
        </p>
      </div>

      <div style={{ display: "flex", gap: "4px" }}>
        {[Phone, Video, MoreVertical].map((Icon, i) => (
          <button
            key={i}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-secondary)",
              cursor: "pointer",
              padding: "8px",
              borderRadius: "var(--radius-sm)",
              display: "flex",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-hover)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            <Icon size={18} />
          </button>
        ))}
      </div>
    </div>
  );
}
