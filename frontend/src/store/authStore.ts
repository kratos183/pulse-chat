"use client";

import { create } from "zustand";
import { authAPI } from "@/lib/api";
import { connectSocket, disconnectSocket } from "@/lib/socket";

interface User {
  _id: string;
  name: string;
  email: string;
  avatarUrl: string;
  isOnline: boolean;
  token?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  register: (data: {
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  login: (data: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,

  register: async (data) => {
    try {
      set({ isLoading: true, error: null });
      const res = await authAPI.register(data);
      const user = res.data;
      if (user.token) {
        localStorage.setItem("chat_token", user.token);
      }
      set({ user, isAuthenticated: true, isLoading: false });
      connectSocket({ _id: user._id });
    } catch (err: any) {
      set({
        error: err.response?.data?.message || "Registration failed",
        isLoading: false,
      });
      throw err;
    }
  },

  login: async (data) => {
    try {
      set({ isLoading: true, error: null });
      const res = await authAPI.login(data);
      const user = res.data;
      if (user.token) {
        localStorage.setItem("chat_token", user.token);
      }
      set({ user, isAuthenticated: true, isLoading: false });
      connectSocket({ _id: user._id });
    } catch (err: any) {
      set({
        error: err.response?.data?.message || "Login failed",
        isLoading: false,
      });
      throw err;
    }
  },

  logout: async () => {
    try {
      await authAPI.logout();
    } catch {}
    localStorage.removeItem("chat_token");
    disconnectSocket();
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  checkAuth: async () => {
    try {
      set({ isLoading: true });
      const token = localStorage.getItem("chat_token");
      if (!token) {
        set({ isLoading: false });
        return;
      }
      const res = await authAPI.getMe();
      set({ user: res.data, isAuthenticated: true, isLoading: false });
      connectSocket({ _id: res.data._id });
    } catch {
      localStorage.removeItem("chat_token");
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
