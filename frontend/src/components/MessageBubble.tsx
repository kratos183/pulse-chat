"use client";

import Avatar from "./Avatar";
import { Check, CheckCheck, Clock, Download } from "lucide-react";

interface MessageBubbleProps {
  message: any;
  isOwn: boolean;
  showAvatar: boolean;
  isLastInGroup: boolean;
  chatUsers: any[];
}

export default function MessageBubble({
  message,
  isOwn,
  showAvatar,
  isLastInGroup,
  chatUsers,
}: MessageBubbleProps) {
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Read receipt logic
  const getReadStatus = () => {
    if (!isOwn) return null;
    if (message._optimistic) return "sending";

    const readByOthers = message.readBy?.filter(
      (r: any) => (r._id || r) !== message.sender?._id
    );

    const totalOthers = chatUsers.filter(
      (u: any) => u._id !== message.sender?._id
    );

    if (readByOthers?.length >= totalOthers.length && totalOthers.length > 0) {
      return "read";
    }
    if (readByOthers?.length > 0) {
      return "delivered";
    }
    return "sent";
  };

  const readStatus = getReadStatus();

  const ReadIcon = () => {
    switch (readStatus) {
      case "sending":
        return <Clock size={14} style={{ color: "var(--text-muted)" }} />;
      case "sent":
        return <Check size={14} style={{ color: "var(--text-muted)" }} />;
      case "delivered":
        return <CheckCheck size={14} style={{ color: "var(--text-muted)" }} />;
      case "read":
        return <CheckCheck size={14} style={{ color: "#3b82f6" }} />;
      default:
        return null;
    }
  };

  return (
    <div
      className="animate-fade-in"
      style={{
        display: "flex",
        flexDirection: isOwn ? "row-reverse" : "row",
        alignItems: "flex-end",
        gap: "8px",
        marginBottom: isLastInGroup ? "12px" : "2px",
        paddingLeft: !isOwn && !showAvatar ? "40px" : "0",
      }}
    >
      {/* Avatar */}
      {!isOwn && showAvatar && (
        <Avatar
          name={message.sender?.name || ""}
          src={message.sender?.avatarUrl}
          size={32}
        />
      )}

      {/* Bubble */}
      <div style={{ maxWidth: "65%", minWidth: "80px" }}>
        {/* Sender name for group chats */}
        {!isOwn && showAvatar && (
          <span
            style={{
              fontSize: "11px",
              fontWeight: "600",
              color: "var(--accent)",
              marginBottom: "2px",
              display: "block",
              paddingLeft: "4px",
            }}
          >
            {message.sender?.name}
          </span>
        )}

        <div
          style={{
            padding:
              message.attachments?.length > 0 && !message.content
                ? "4px"
                : "10px 14px",
            background: isOwn ? "var(--message-out)" : "var(--message-in)",
            borderRadius: isOwn
              ? isLastInGroup
                ? "var(--radius-lg) var(--radius-lg) var(--radius-sm) var(--radius-lg)"
                : "var(--radius-lg)"
              : isLastInGroup
              ? "var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm)"
              : "var(--radius-lg)",
            border: isOwn ? "none" : "1px solid var(--border-color)",
            position: "relative",
            opacity: message._optimistic ? 0.7 : 1,
            transition: "opacity 0.2s",
          }}
        >
          {/* Attachments */}
          {message.attachments?.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "4px",
                marginBottom: message.content ? "8px" : "0",
              }}
            >
              {message.attachments.map((url: string, i: number) => {
                const isVideo = /\.(mp4|webm|mov|avi)/i.test(url) || url.includes("/video/");
                const isAudio = /\.(mp3|wav|ogg)/i.test(url) || url.includes("/audio/");

                return (
                  <div
                    key={i}
                    style={{
                      position: "relative",
                      borderRadius: "var(--radius-sm)",
                      overflow: "hidden",
                    }}
                  >
                    {isVideo ? (
                      <video
                        src={url}
                        controls
                        style={{
                          maxWidth: "300px",
                          maxHeight: "220px",
                          borderRadius: "var(--radius-sm)",
                          display: "block",
                        }}
                      />
                    ) : isAudio ? (
                      <div style={{ padding: "8px", background: "var(--bg-tertiary)", borderRadius: "var(--radius-sm)" }}>
                        <audio src={url} controls style={{ width: "220px", height: "36px" }} />
                      </div>
                    ) : (
                      <img
                        src={url}
                        alt="attachment"
                        style={{
                          maxWidth: "260px",
                          maxHeight: "200px",
                          borderRadius: "var(--radius-sm)",
                          display: "block",
                          objectFit: "cover",
                        }}
                        loading="lazy"
                      />
                    )}
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        position: "absolute",
                        top: "6px",
                        right: "6px",
                        background: "rgba(0,0,0,0.6)",
                        borderRadius: "50%",
                        padding: "4px",
                        display: "flex",
                        color: "white",
                      }}
                    >
                      <Download size={14} />
                    </a>
                  </div>
                );
              })}
            </div>
          )}

          {/* Message text */}
          {message.content && (
            <p
              style={{
                fontSize: "14px",
                lineHeight: "1.5",
                wordBreak: "break-word",
                color: isOwn ? "white" : "var(--text-primary)",
                margin: 0,
              }}
            >
              {message.content}
            </p>
          )}

          {/* Time & read status */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "4px",
              marginTop: "4px",
            }}
          >
            <span
              style={{
                fontSize: "10px",
                color: isOwn
                  ? "rgba(255,255,255,0.6)"
                  : "var(--text-muted)",
              }}
            >
              {time}
            </span>
            {isOwn && <ReadIcon />}
          </div>
        </div>
      </div>
    </div>
  );
}
