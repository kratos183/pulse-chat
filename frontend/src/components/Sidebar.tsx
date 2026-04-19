"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { userAPI } from "@/lib/api";
import { getChatName, getOtherUser, formatTime } from "@/lib/utils";
import Avatar from "./Avatar";
import GroupModal from "./GroupModal";
import {
  Search,
  Plus,
  LogOut,
  Users,
  MessageCircle,
  X,
  Hash,
} from "lucide-react";

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const {
    chats,
    selectedChat,
    fetchChats,
    selectChat,
    accessChat,
    isLoadingChats,
    onlineUsers,
    typingUsers,
  } = useChatStore();

  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // Search users with debounce
  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await userAPI.search(search);
        setSearchResults(res.data);
      } catch {
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleUserClick = async (userId: string) => {
    try {
      const chat = await accessChat(userId);
      selectChat(chat);
      setSearch("");
      setSearchResults([]);
    } catch {}
  };

  const handleLogout = async () => {
    await logout();
  };

  const isUserOnline = (chat: any): boolean => {
    if (chat.isGroupChat) return false;
    const other = getOtherUser(chat, user?._id || "");
    return other ? onlineUsers.includes(other._id) : false;
  };

  const getChatTypingText = (chatId: string): string | null => {
    const typing = typingUsers[chatId];
    if (!typing || typing.length === 0) return null;
    if (typing.length === 1) return `${typing[0].userName} is typing...`;
    return `${typing.length} people typing...`;
  };

  return (
    <>
      <div
        style={{
          width: "360px",
          minWidth: "360px",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          background: "var(--bg-secondary)",
          borderRight: "1px solid var(--border-color)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px",
            borderBottom: "1px solid var(--border-color)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Avatar
                name={user?.name || ""}
                src={user?.avatarUrl}
                size={36}
              />
              <div>
                <h1
                  style={{
                    fontSize: "18px",
                    fontWeight: "700",
                    letterSpacing: "-0.3px",
                  }}
                >
                  <span className="gradient-text">Pulse</span>
                </h1>
              </div>
            </div>
            <div style={{ display: "flex", gap: "4px" }}>
              <button
                id="new-group-btn"
                onClick={() => setShowGroupModal(true)}
                title="New Group"
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
                <Users size={20} />
              </button>
              <button
                id="logout-btn"
                onClick={handleLogout}
                title="Logout"
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
                  e.currentTarget.style.background = "rgba(255,71,87,0.1)";
                  e.currentTarget.style.color = "var(--danger)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }}
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div style={{ position: "relative" }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
              }}
            />
            <input
              id="user-search"
              type="text"
              className="input-field"
              placeholder="Search users to chat..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                paddingLeft: "36px",
                paddingRight: search ? "36px" : "12px",
                fontSize: "13px",
                padding: "10px 12px 10px 36px",
              }}
            />
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setSearchResults([]);
                }}
                style={{
                  position: "absolute",
                  right: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  padding: "4px",
                  display: "flex",
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Search results */}
        {search && (
          <div
            style={{
              borderBottom: "1px solid var(--border-color)",
              maxHeight: "240px",
              overflowY: "auto",
            }}
          >
            {isSearching ? (
              <div style={{ padding: "16px", textAlign: "center" }}>
                <div
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "13px",
                  }}
                >
                  Searching...
                </div>
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((u) => (
                <button
                  key={u._id}
                  onClick={() => handleUserClick(u._id)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 20px",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background 0.15s",
                    color: "var(--text-primary)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--bg-hover)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <Avatar
                    name={u.name}
                    src={u.avatarUrl}
                    size={36}
                    isOnline={onlineUsers.includes(u._id)}
                    showStatus
                  />
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: "500" }}>
                      {u.name}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--text-muted)",
                      }}
                    >
                      {u.email}
                    </div>
                  </div>
                  <Plus
                    size={16}
                    style={{
                      marginLeft: "auto",
                      color: "var(--accent)",
                    }}
                  />
                </button>
              ))
            ) : (
              <div
                style={{
                  padding: "16px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: "13px",
                }}
              >
                No users found
              </div>
            )}
          </div>
        )}

        {/* Chat list */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
          }}
        >
          {isLoadingChats ? (
            <div style={{ padding: "16px" }}>
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: "12px",
                    padding: "12px 0",
                    alignItems: "center",
                  }}
                >
                  <div
                    className="skeleton"
                    style={{ width: 44, height: 44, borderRadius: "50%" }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      className="skeleton"
                      style={{ height: 14, width: "60%", marginBottom: 8 }}
                    />
                    <div
                      className="skeleton"
                      style={{ height: 12, width: "80%" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : chats.length === 0 ? (
            <div
              style={{
                padding: "40px 20px",
                textAlign: "center",
              }}
            >
              <MessageCircle
                size={40}
                style={{
                  color: "var(--text-muted)",
                  margin: "0 auto 12px",
                  opacity: 0.5,
                }}
              />
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: "14px",
                }}
              >
                No conversations yet
              </p>
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: "12px",
                  marginTop: "4px",
                }}
              >
                Search for users to start chatting
              </p>
            </div>
          ) : (
            chats.map((chat) => {
              const chatName = getChatName(chat, user?._id || "");
              const isSelected = selectedChat?._id === chat._id;
              const online = isUserOnline(chat);
              const typingText = getChatTypingText(chat._id);
              const otherUser = getOtherUser(chat, user?._id || "");
              const latestMsg = chat.latestMessage;

              return (
                <button
                  key={chat._id}
                  id={`chat-${chat._id}`}
                  onClick={() => selectChat(chat)}
                  className="animate-fade-in"
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "14px 20px",
                    background: isSelected
                      ? "var(--accent-light)"
                      : "transparent",
                    border: "none",
                    borderLeft: isSelected
                      ? "3px solid var(--accent)"
                      : "3px solid transparent",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s",
                    color: "var(--text-primary)",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected)
                      e.currentTarget.style.background = "var(--bg-hover)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected)
                      e.currentTarget.style.background = "transparent";
                  }}
                >
                  {chat.isGroupChat ? (
                    <div
                      style={{
                        width: 44,
                        height: 44,
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
                      size={44}
                      isOnline={online}
                      showStatus
                    />
                  )}
                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "4px",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: "600",
                          fontSize: "14px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {chatName}
                      </span>
                      {latestMsg && (
                        <span
                          style={{
                            fontSize: "11px",
                            color: "var(--text-muted)",
                            flexShrink: 0,
                            marginLeft: "8px",
                          }}
                        >
                          {formatTime(latestMsg.createdAt || chat.updatedAt)}
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        color: typingText
                          ? "var(--accent)"
                          : "var(--text-muted)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        fontStyle: typingText ? "italic" : "normal",
                      }}
                    >
                      {typingText
                        ? typingText
                        : latestMsg
                        ? `${
                            latestMsg.sender?._id === user?._id
                              ? "You: "
                              : ""
                          }${
                            latestMsg.content ||
                            (latestMsg.attachments?.length
                              ? "📎 Attachment"
                              : "")
                          }`
                        : "Start a conversation"}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {showGroupModal && (
        <GroupModal onClose={() => setShowGroupModal(false)} />
      )}
    </>
  );
}
