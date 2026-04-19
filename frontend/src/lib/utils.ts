import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: "short" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getChatName(chat: any, currentUserId: string): string {
  if (chat.isGroupChat) return chat.chatName;
  const otherUser = chat.users?.find((u: any) => u._id !== currentUserId);
  return otherUser?.name || "Unknown User";
}

export function getChatAvatar(chat: any, currentUserId: string): string {
  if (chat.isGroupChat) return "";
  const otherUser = chat.users?.find((u: any) => u._id !== currentUserId);
  return otherUser?.avatarUrl || "";
}

export function getOtherUser(chat: any, currentUserId: string): any {
  if (chat.isGroupChat) return null;
  return chat.users?.find((u: any) => u._id !== currentUserId);
}
