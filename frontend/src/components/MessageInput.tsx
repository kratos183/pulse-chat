"use client";

import { useState, useRef, FormEvent, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { messageAPI } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { Send, Paperclip, X, Loader2, Film, FileText, Music } from "lucide-react";

export default function MessageInput() {
  const { user } = useAuthStore();
  const { selectedChat, addOptimisticMessage, reconcileMessage, updateLatestMessage } =
    useChatStore();
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  const handleTyping = useCallback(() => {
    if (!selectedChat || !user) return;
    const socket = getSocket();

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit("typing", {
        chatId: selectedChat._id,
        userId: user._id,
        userName: user.name,
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit("stop_typing", {
        chatId: selectedChat._id,
        userId: user._id,
      });
    }, 2000);
  }, [selectedChat, user]);

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selectedFiles]);

    selectedFiles.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setPreviews((prev) => [...prev, ev.target?.result as string]);
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith("video/")) {
        // Generate video thumbnail
        const url = URL.createObjectURL(file);
        setPreviews((prev) => [...prev, `video:${url}`]);
      } else {
        setPreviews((prev) => [...prev, `file:${file.name}`]);
      }
    });
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if ((!content.trim() && files.length === 0) || !selectedChat || !user)
      return;

    // Stop typing
    if (isTypingRef.current) {
      isTypingRef.current = false;
      const socket = getSocket();
      socket.emit("stop_typing", {
        chatId: selectedChat._id,
        userId: user._id,
      });
    }

    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    // Optimistic UI update
    const optimisticMsg = {
      _id: tempId,
      tempId,
      sender: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl || "",
      },
      chat: selectedChat,
      content: content.trim(),
      attachments: previews.filter(Boolean),
      readBy: [user._id],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _optimistic: true,
    };

    addOptimisticMessage(optimisticMsg);

    const msgContent = content.trim();
    setContent("");
    setFiles([]);
    setPreviews([]);
    setIsSending(true);

    try {
      let response;
      if (files.length > 0) {
        const formData = new FormData();
        formData.append("chatId", selectedChat._id);
        formData.append("content", msgContent);
        formData.append("tempId", tempId);
        files.forEach((file) => formData.append("attachments", file));
        response = await messageAPI.send(formData);
      } else {
        response = await messageAPI.sendText(selectedChat._id, msgContent, tempId);
      }

      const realMessage = response.data;

      // Reconcile optimistic message with real one
      reconcileMessage(tempId, realMessage);

      // Update latest message
      updateLatestMessage(selectedChat._id, realMessage);

      // Broadcast via socket
      const socket = getSocket();
      socket.emit("new_message", realMessage);
    } catch (error) {
      console.error("Failed to send message:", error);
      // Remove optimistic message on failure
      reconcileMessage(tempId, {
        ...optimisticMsg,
        _optimistic: false,
        content: `❌ ${msgContent} (failed to send)`,
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      style={{
        borderTop: "1px solid var(--border-color)",
        background: "var(--bg-secondary)",
      }}
    >
      {/* File previews */}
      {previews.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: "8px",
            padding: "12px 24px 0",
            flexWrap: "wrap",
          }}
        >
          {previews.map((preview, i) => (
            <div
              key={i}
              style={{
                position: "relative",
                borderRadius: "var(--radius-sm)",
                overflow: "hidden",
                border: "1px solid var(--border-color)",
              }}
            >
              {preview.startsWith("video:") ? (
                <div
                  style={{
                    width: 64,
                    height: 64,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "var(--bg-tertiary)",
                    gap: "2px",
                  }}
                >
                  <Film size={20} style={{ color: "var(--accent)" }} />
                  <span style={{ fontSize: "8px", color: "var(--text-muted)" }}>
                    {files[i]?.name.slice(0, 10)}
                  </span>
                </div>
              ) : preview.startsWith("file:") ? (
                <div
                  style={{
                    width: 64,
                    height: 64,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "var(--bg-tertiary)",
                    gap: "2px",
                  }}
                >
                  {files[i]?.type.startsWith("audio/") ? (
                    <Music size={20} style={{ color: "var(--success)" }} />
                  ) : (
                    <FileText size={20} style={{ color: "var(--warning)" }} />
                  )}
                  <span style={{ fontSize: "8px", color: "var(--text-muted)" }}>
                    {files[i]?.name.slice(0, 10)}
                  </span>
                </div>
              ) : preview ? (
                <img
                  src={preview}
                  alt="preview"
                  style={{
                    width: 64,
                    height: 64,
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 64,
                    height: 64,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "var(--bg-tertiary)",
                    fontSize: "10px",
                    color: "var(--text-muted)",
                    padding: "4px",
                    textAlign: "center",
                    wordBreak: "break-all",
                  }}
                >
                  {files[i]?.name.slice(0, 12)}
                </div>
              )}
              <button
                onClick={() => removeFile(i)}
                style={{
                  position: "absolute",
                  top: 2,
                  right: 2,
                  background: "rgba(0,0,0,0.7)",
                  border: "none",
                  borderRadius: "50%",
                  width: 18,
                  height: 18,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "white",
                  padding: 0,
                }}
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      <form
        className="message-input-form"
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "6px",
          padding: "12px 16px 16px",
        }}
      >
        {/* File attach button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-secondary)",
            cursor: "pointer",
            padding: "10px",
            borderRadius: "var(--radius-sm)",
            display: "flex",
            transition: "all 0.2s",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--bg-hover)";
            e.currentTarget.style.color = "var(--accent)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--text-secondary)";
          }}
        >
          <Paperclip size={20} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
          multiple
          onChange={handleFilesChange}
          style={{ display: "none" }}
        />

        {/* Text input */}
        <div style={{ flex: 1, position: "relative" }}>
          <input
            id="message-input"
            type="text"
            className="input-field"
            placeholder="Type a message..."
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              handleTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                // form will handle submit
              }
            }}
            style={{
              paddingRight: "16px",
              background: "var(--bg-tertiary)",
            }}
          />
        </div>

        {/* Send button */}
        <button
          id="send-btn"
          type="submit"
          disabled={
            isSending || (!content.trim() && files.length === 0)
          }
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "50%",
            background:
              content.trim() || files.length > 0
                ? "var(--gradient-1)"
                : "var(--bg-tertiary)",
            border: "none",
            color:
              content.trim() || files.length > 0
                ? "white"
                : "var(--text-muted)",
            cursor:
              content.trim() || files.length > 0
                ? "pointer"
                : "default",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s",
            flexShrink: 0,
            boxShadow:
              content.trim() || files.length > 0
                ? "var(--shadow-glow)"
                : "none",
          }}
        >
          {isSending ? (
            <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
          ) : (
            <Send size={18} />
          )}
        </button>
      </form>
    </div>
  );
}
