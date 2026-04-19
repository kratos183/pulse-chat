"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { getSocket } from "@/lib/socket";
import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";
import EmptyState from "@/components/EmptyState";

export default function ChatPage() {
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const {
    selectedChat,
    setOnlineUsers,
    updateUserOnline,
    addMessage,
    addTypingUser,
    removeTypingUser,
    updateReadReceipts,
  } = useChatStore();
  const router = useRouter();

  // Check authentication
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isLoading, isAuthenticated, router]);

  // Setup socket listeners
  useEffect(() => {
    if (!user) return;

    const socket = getSocket();

    socket.on("online_users", (users: string[]) => {
      setOnlineUsers(users);
    });

    socket.on(
      "user_online",
      ({ userId, isOnline }: { userId: string; isOnline: boolean }) => {
        updateUserOnline(userId, isOnline);
      }
    );

    socket.on("message_received", (message: any) => {
      addMessage(message);
    });

    socket.on("typing", ({ chatId, userId, userName }: any) => {
      addTypingUser(chatId, userId, userName);
    });

    socket.on("stop_typing", ({ chatId, userId }: any) => {
      removeTypingUser(chatId, userId);
    });

    socket.on("message_read", ({ chatId, userId }: any) => {
      updateReadReceipts(chatId, userId);
    });

    return () => {
      socket.off("online_users");
      socket.off("user_online");
      socket.off("message_received");
      socket.off("typing");
      socket.off("stop_typing");
      socket.off("message_read");
    };
  }, [
    user,
    setOnlineUsers,
    updateUserOnline,
    addMessage,
    addTypingUser,
    removeTypingUser,
    updateReadReceipts,
  ]);

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-primary)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            className="animate-spin"
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              border: "3px solid var(--border-color)",
              borderTopColor: "var(--accent)",
              margin: "0 auto 16px",
            }}
          />
          <p style={{ color: "var(--text-secondary)" }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div
      className="chat-layout"
      style={{
        height: "100vh",
        display: "flex",
        background: "var(--bg-primary)",
        overflow: "hidden",
      }}
    >
      {/* Sidebar: on mobile, hide when a chat is selected */}
      <div
        className={`sidebar ${selectedChat ? "hidden-mobile" : ""}`}
        style={{
          height: "100vh",
          flexShrink: 0,
        }}
      >
        <Sidebar />
      </div>

      {/* Chat area or empty state */}
      {selectedChat ? (
        <div
          className="chat-area"
          style={{
            flex: 1,
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
          }}
        >
          <ChatArea />
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
