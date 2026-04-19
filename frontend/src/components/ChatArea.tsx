"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { getSocket } from "@/lib/socket";
import { getChatName, getOtherUser } from "@/lib/utils";
import { messageAPI } from "@/lib/api";
import Avatar from "./Avatar";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import ChatHeader from "./ChatHeader";
import {
  Loader2,
  ArrowUp,
} from "lucide-react";

export default function ChatArea() {
  const { user } = useAuthStore();
  const {
    selectedChat,
    messages,
    pagination,
    isLoadingMessages,
    isLoadingMore,
    fetchMessages,
    loadMoreMessages,
    typingUsers,
  } = useChatStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevMessagesLenRef = useRef(0);

  // Fetch messages when chat is selected
  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat._id);
      // Join socket room
      const socket = getSocket();
      socket.emit("join_chat", selectedChat._id);

      // Mark as read
      messageAPI.markAsRead(selectedChat._id).catch(() => {});

      // Emit read receipt via socket
      socket.emit("message_read", {
        chatId: selectedChat._id,
        userId: user?._id,
      });

      return () => {
        socket.emit("leave_chat", selectedChat._id);
      };
    }
  }, [selectedChat, fetchMessages, user]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > prevMessagesLenRef.current) {
      // Only auto-scroll if we added to the end (not loaded older messages)
      const addedToEnd =
        messages.length - prevMessagesLenRef.current <= 2;
      if (addedToEnd) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
    prevMessagesLenRef.current = messages.length;
  }, [messages]);

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    if (container.scrollTop <= 60 && pagination?.hasMore && !isLoadingMore) {
      const prevHeight = container.scrollHeight;
      loadMoreMessages().then(() => {
        // Maintain scroll position after loading older messages
        requestAnimationFrame(() => {
          if (container) {
            container.scrollTop = container.scrollHeight - prevHeight;
          }
        });
      });
    }
  }, [pagination, isLoadingMore, loadMoreMessages]);

  const typingList = selectedChat
    ? typingUsers[selectedChat._id]?.filter((t) => t.userId !== user?._id) || []
    : [];

  if (!selectedChat) return null;

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-primary)",
        height: "100vh",
        minWidth: 0,
      }}
    >
      {/* Chat Header */}
      <ChatHeader />

      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 24px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Load more indicator */}
        {isLoadingMore && (
          <div
            style={{
              textAlign: "center",
              padding: "12px",
            }}
          >
            <Loader2
              size={20}
              style={{
                color: "var(--accent)",
                animation: "spin 1s linear infinite",
              }}
            />
          </div>
        )}

        {pagination?.hasMore && !isLoadingMore && (
          <button
            onClick={loadMoreMessages}
            style={{
              alignSelf: "center",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-full)",
              color: "var(--text-secondary)",
              fontSize: "12px",
              cursor: "pointer",
              marginBottom: "12px",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--bg-secondary)";
            }}
          >
            <ArrowUp size={14} />
            Load older messages
          </button>
        )}

        {isLoadingMessages ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Loader2
              size={32}
              style={{
                color: "var(--accent)",
                animation: "spin 1s linear infinite",
              }}
            />
          </div>
        ) : messages.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
            }}
          >
            <div>
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: "14px",
                  marginBottom: "4px",
                }}
              >
                No messages yet
              </p>
              <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                Send a message to start the conversation 💬
              </p>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: "auto" }}>
            {messages.map((msg, index) => {
              const isOwn = msg.sender?._id === user?._id;
              const showAvatar =
                !isOwn &&
                (index === 0 ||
                  messages[index - 1]?.sender?._id !== msg.sender?._id);
              const isLastInGroup =
                index === messages.length - 1 ||
                messages[index + 1]?.sender?._id !== msg.sender?._id;

              return (
                <MessageBubble
                  key={msg._id || msg.tempId}
                  message={msg}
                  isOwn={isOwn}
                  showAvatar={showAvatar}
                  isLastInGroup={isLastInGroup}
                  chatUsers={selectedChat.users}
                />
              );
            })}
          </div>
        )}

        {/* Typing indicator */}
        {typingList.length > 0 && (
          <div
            className="animate-fade-in"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 0",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "10px 16px",
                background: "var(--bg-secondary)",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--border-color)",
              }}
            >
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span
                style={{
                  marginLeft: "8px",
                  fontSize: "12px",
                  color: "var(--text-muted)",
                }}
              >
                {typingList.length === 1
                  ? `${typingList[0].userName} is typing`
                  : `${typingList.length} people typing`}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <MessageInput />
    </div>
  );
}
