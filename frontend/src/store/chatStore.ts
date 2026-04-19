"use client";

import { create } from "zustand";
import { chatAPI, messageAPI } from "@/lib/api";

interface Message {
  _id: string;
  sender: { _id: string; name: string; email: string; avatarUrl: string };
  chat: any;
  content: string;
  attachments: string[];
  readBy: any[];
  tempId?: string;
  createdAt: string;
  updatedAt: string;
  _optimistic?: boolean;
}

interface Chat {
  _id: string;
  chatName: string;
  isGroupChat: boolean;
  users: any[];
  latestMessage?: any;
  groupAdmin?: any;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  totalMessages: number;
  totalPages: number;
  hasMore: boolean;
}

interface ChatState {
  chats: Chat[];
  selectedChat: Chat | null;
  messages: Message[];
  pagination: Pagination | null;
  isLoadingChats: boolean;
  isLoadingMessages: boolean;
  isLoadingMore: boolean;
  onlineUsers: string[];
  typingUsers: { [chatId: string]: { userId: string; userName: string }[] };

  fetchChats: () => Promise<void>;
  selectChat: (chat: Chat | null) => void;
  fetchMessages: (chatId: string, page?: number) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  addMessage: (message: Message) => void;
  addOptimisticMessage: (message: Message) => void;
  reconcileMessage: (tempId: string, realMessage: Message) => void;
  updateLatestMessage: (chatId: string, message: any) => void;
  setOnlineUsers: (users: string[]) => void;
  updateUserOnline: (userId: string, isOnline: boolean) => void;
  addTypingUser: (chatId: string, userId: string, userName: string) => void;
  removeTypingUser: (chatId: string, userId: string) => void;
  accessChat: (userId: string) => Promise<Chat>;
  createGroup: (name: string, users: string[]) => Promise<Chat>;
  addToGroup: (chatId: string, userId: string) => Promise<void>;
  removeFromGroup: (chatId: string, userId: string) => Promise<void>;
  updateReadReceipts: (chatId: string, userId: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  selectedChat: null,
  messages: [],
  pagination: null,
  isLoadingChats: false,
  isLoadingMessages: false,
  isLoadingMore: false,
  onlineUsers: [],
  typingUsers: {},

  fetchChats: async () => {
    try {
      set({ isLoadingChats: true });
      const res = await chatAPI.fetchAll();
      set({ chats: res.data, isLoadingChats: false });
    } catch {
      set({ isLoadingChats: false });
    }
  },

  selectChat: (chat) => {
    set({ selectedChat: chat, messages: [], pagination: null });
  },

  fetchMessages: async (chatId, page = 1) => {
    try {
      set({ isLoadingMessages: true });
      const res = await messageAPI.fetch(chatId, page);
      set({
        messages: res.data.messages,
        pagination: res.data.pagination,
        isLoadingMessages: false,
      });
      // Mark as read
      messageAPI.markAsRead(chatId).catch(() => {});
    } catch {
      set({ isLoadingMessages: false });
    }
  },

  loadMoreMessages: async () => {
    const { selectedChat, pagination, messages } = get();
    if (!selectedChat || !pagination?.hasMore || get().isLoadingMore) return;

    try {
      set({ isLoadingMore: true });
      const nextPage = pagination.page + 1;
      const res = await messageAPI.fetch(selectedChat._id, nextPage);
      set({
        messages: [...res.data.messages, ...messages],
        pagination: res.data.pagination,
        isLoadingMore: false,
      });
    } catch {
      set({ isLoadingMore: false });
    }
  },

  addMessage: (message) => {
    const { messages, selectedChat } = get();
    // Only add if it's for the currently selected chat
    if (selectedChat && message.chat?._id === selectedChat._id) {
      // Check for duplicates
      const exists = messages.some((m) => m._id === message._id);
      if (!exists) {
        set({ messages: [...messages, message] });
      }
    }
    // Update latest message in chat list
    get().updateLatestMessage(
      message.chat?._id || message.chat,
      message
    );
  },

  addOptimisticMessage: (message) => {
    set({ messages: [...get().messages, message] });
  },

  reconcileMessage: (tempId, realMessage) => {
    set({
      messages: get().messages.map((m) =>
        m.tempId === tempId ? { ...realMessage, _optimistic: false } : m
      ),
    });
  },

  updateLatestMessage: (chatId, message) => {
    set({
      chats: get()
        .chats.map((c) =>
          c._id === chatId ? { ...c, latestMessage: message, updatedAt: new Date().toISOString() } : c
        )
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        ),
    });
  },

  setOnlineUsers: (users) => set({ onlineUsers: users }),

  updateUserOnline: (userId, isOnline) => {
    const { onlineUsers } = get();
    if (isOnline) {
      if (!onlineUsers.includes(userId)) {
        set({ onlineUsers: [...onlineUsers, userId] });
      }
    } else {
      set({ onlineUsers: onlineUsers.filter((id) => id !== userId) });
    }
  },

  addTypingUser: (chatId, userId, userName) => {
    const { typingUsers } = get();
    const chatTyping = typingUsers[chatId] || [];
    if (!chatTyping.find((t) => t.userId === userId)) {
      set({
        typingUsers: {
          ...typingUsers,
          [chatId]: [...chatTyping, { userId, userName }],
        },
      });
    }
  },

  removeTypingUser: (chatId, userId) => {
    const { typingUsers } = get();
    const chatTyping = typingUsers[chatId] || [];
    set({
      typingUsers: {
        ...typingUsers,
        [chatId]: chatTyping.filter((t) => t.userId !== userId),
      },
    });
  },

  accessChat: async (userId) => {
    const res = await chatAPI.accessChat(userId);
    const { chats } = get();
    const exists = chats.find((c) => c._id === res.data._id);
    if (!exists) {
      set({ chats: [res.data, ...chats] });
    }
    return res.data;
  },

  createGroup: async (name, users) => {
    const res = await chatAPI.createGroup(name, users);
    set({ chats: [res.data, ...get().chats] });
    return res.data;
  },

  addToGroup: async (chatId, userId) => {
    const res = await chatAPI.addToGroup(chatId, userId);
    set({
      chats: get().chats.map((c) => (c._id === chatId ? res.data : c)),
      selectedChat:
        get().selectedChat?._id === chatId ? res.data : get().selectedChat,
    });
  },

  removeFromGroup: async (chatId, userId) => {
    const res = await chatAPI.removeFromGroup(chatId, userId);
    set({
      chats: get().chats.map((c) => (c._id === chatId ? res.data : c)),
      selectedChat:
        get().selectedChat?._id === chatId ? res.data : get().selectedChat,
    });
  },

  updateReadReceipts: (chatId, userId) => {
    const { messages, selectedChat } = get();
    if (selectedChat?._id === chatId) {
      set({
        messages: messages.map((m) => {
          if (!m.readBy.find((r: any) => (r._id || r) === userId)) {
            return { ...m, readBy: [...m.readBy, userId] };
          }
          return m;
        }),
      });
    }
  },
}));
