"use client";

import { getInitials } from "@/lib/utils";

interface AvatarProps {
  name: string;
  src?: string;
  size?: number;
  isOnline?: boolean;
  showStatus?: boolean;
}

const colorMap: { [key: string]: string } = {};
const gradients = [
  "linear-gradient(135deg, #6c5ce7, #a855f7)",
  "linear-gradient(135deg, #0ea5e9, #6366f1)",
  "linear-gradient(135deg, #ec4899, #f43f5e)",
  "linear-gradient(135deg, #10b981, #059669)",
  "linear-gradient(135deg, #f59e0b, #ef4444)",
  "linear-gradient(135deg, #8b5cf6, #ec4899)",
  "linear-gradient(135deg, #14b8a6, #0ea5e9)",
  "linear-gradient(135deg, #f97316, #eab308)",
];

function getGradient(name: string): string {
  if (!colorMap[name]) {
    const index =
      name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) %
      gradients.length;
    colorMap[name] = gradients[index];
  }
  return colorMap[name];
}

export default function Avatar({
  name,
  src,
  size = 40,
  isOnline,
  showStatus = false,
}: AvatarProps) {
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      {src ? (
        <img
          src={src}
          alt={name}
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            objectFit: "cover",
          }}
        />
      ) : (
        <div
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            background: getGradient(name),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: size * 0.35,
            fontWeight: "700",
            color: "white",
            letterSpacing: "0.5px",
          }}
        >
          {getInitials(name)}
        </div>
      )}
      {showStatus && (
        <div
          className={`online-indicator ${isOnline ? "" : "offline"}`}
          style={{
            width: size * 0.28,
            height: size * 0.28,
            borderWidth: size * 0.06,
          }}
        />
      )}
    </div>
  );
}
