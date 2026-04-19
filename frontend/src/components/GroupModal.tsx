"use client";

import { useState, useEffect } from "react";
import { useChatStore } from "@/store/chatStore";
import { userAPI } from "@/lib/api";
import Avatar from "./Avatar";
import { X, Search, Users, Loader2 } from "lucide-react";

interface GroupModalProps {
  onClose: () => void;
}

export default function GroupModal({ onClose }: GroupModalProps) {
  const { createGroup, selectChat } = useChatStore();
  const [groupName, setGroupName] = useState("");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await userAPI.search(search);
        setSearchResults(
          res.data.filter(
            (u: any) => !selectedUsers.find((s) => s._id === u._id)
          )
        );
      } catch {
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, selectedUsers]);

  const addUser = (user: any) => {
    setSelectedUsers([...selectedUsers, user]);
    setSearch("");
    setSearchResults([]);
  };

  const removeUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter((u) => u._id !== userId));
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      setError("Group name is required");
      return;
    }
    if (selectedUsers.length < 2) {
      setError("Select at least 2 users");
      return;
    }

    try {
      setIsCreating(true);
      setError("");
      const chat = await createGroup(
        groupName,
        selectedUsers.map((u) => u._id)
      );
      selectChat(chat);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create group");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        className="glass animate-scale-in"
        style={{
          width: "100%",
          maxWidth: "440px",
          borderRadius: "var(--radius-xl)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px",
            borderBottom: "1px solid var(--border-color)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "var(--radius-sm)",
                background: "var(--gradient-2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Users size={18} color="white" />
            </div>
            <h3 style={{ fontSize: "16px", fontWeight: "600" }}>
              New Group Chat
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: "20px 24px" }}>
          {/* Group name */}
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                fontSize: "13px",
                fontWeight: "500",
                color: "var(--text-secondary)",
                display: "block",
                marginBottom: "6px",
              }}
            >
              Group Name
            </label>
            <input
              id="group-name-input"
              type="text"
              className="input-field"
              placeholder="Enter group name..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>

          {/* Selected users chips */}
          {selectedUsers.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "6px",
                marginBottom: "16px",
              }}
            >
              {selectedUsers.map((u) => (
                <div
                  key={u._id}
                  className="animate-scale-in"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 10px 4px 4px",
                    background: "var(--accent-light)",
                    border: "1px solid var(--accent)",
                    borderRadius: "var(--radius-full)",
                    fontSize: "12px",
                    fontWeight: "500",
                    color: "var(--accent)",
                  }}
                >
                  <Avatar name={u.name} src={u.avatarUrl} size={22} />
                  {u.name}
                  <button
                    onClick={() => removeUser(u._id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--accent)",
                      cursor: "pointer",
                      padding: "0",
                      display: "flex",
                      marginLeft: "2px",
                    }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Search users */}
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                fontSize: "13px",
                fontWeight: "500",
                color: "var(--text-secondary)",
                display: "block",
                marginBottom: "6px",
              }}
            >
              Add Members
            </label>
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
                id="group-search-input"
                type="text"
                className="input-field"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: "36px" }}
              />
            </div>
          </div>

          {/* Search results */}
          {search && (
            <div
              style={{
                maxHeight: "160px",
                overflowY: "auto",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-color)",
                marginBottom: "16px",
              }}
            >
              {isSearching ? (
                <div
                  style={{
                    padding: "12px",
                    textAlign: "center",
                    color: "var(--text-muted)",
                    fontSize: "13px",
                  }}
                >
                  Searching...
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((u) => (
                  <button
                    key={u._id}
                    onClick={() => addUser(u)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 12px",
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
                    <Avatar name={u.name} src={u.avatarUrl} size={32} />
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: "500" }}>
                        {u.name}
                      </div>
                      <div
                        style={{ fontSize: "11px", color: "var(--text-muted)" }}
                      >
                        {u.email}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div
                  style={{
                    padding: "12px",
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

          {/* Error */}
          {error && (
            <div
              className="animate-fade-in"
              style={{
                background: "rgba(255,71,87,0.1)",
                border: "1px solid rgba(255,71,87,0.3)",
                borderRadius: "var(--radius-sm)",
                padding: "8px 12px",
                marginBottom: "12px",
                color: "var(--danger)",
                fontSize: "12px",
              }}
            >
              {error}
            </div>
          )}

          {/* Create button */}
          <button
            id="create-group-btn"
            onClick={handleCreate}
            disabled={isCreating}
            className="btn-primary"
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "12px",
            }}
          >
            {isCreating ? (
              <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              "Create Group"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
