"use client";

import { MessageCircle, Shield, Zap, Users } from "lucide-react";

export default function EmptyState() {
  const features = [
    { icon: <Zap size={20} />, label: "Real-time messaging" },
    { icon: <Users size={20} />, label: "Group chats" },
    { icon: <Shield size={20} />, label: "End-to-end secure" },
  ];

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-primary)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle grid background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle at 1px 1px, var(--border-color) 1px, transparent 0)",
          backgroundSize: "40px 40px",
          opacity: 0.3,
        }}
      />

      <div
        className="animate-fade-in"
        style={{
          textAlign: "center",
          position: "relative",
          zIndex: 1,
          maxWidth: "400px",
          padding: "40px",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "80px",
            height: "80px",
            borderRadius: "var(--radius-xl)",
            background: "var(--accent-light)",
            marginBottom: "24px",
            animation: "float 3s ease-in-out infinite",
          }}
        >
          <MessageCircle size={40} color="var(--accent)" />
        </div>

        <h2
          style={{
            fontSize: "24px",
            fontWeight: "700",
            marginBottom: "8px",
            letterSpacing: "-0.3px",
          }}
        >
          Welcome to <span className="gradient-text">Pulse</span> Chat
        </h2>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "14px",
            lineHeight: "1.6",
            marginBottom: "32px",
          }}
        >
          Select a conversation from the sidebar or start a new chat to begin
          messaging.
        </p>

        <div
          style={{
            display: "flex",
            gap: "16px",
            justifyContent: "center",
          }}
        >
          {features.map((f, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
                padding: "16px",
                borderRadius: "var(--radius-md)",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-color)",
                minWidth: "100px",
              }}
            >
              <div style={{ color: "var(--accent)" }}>{f.icon}</div>
              <span
                style={{
                  fontSize: "12px",
                  color: "var(--text-secondary)",
                  fontWeight: "500",
                }}
              >
                {f.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
