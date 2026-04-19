import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  withCredentials: true,
});

// Intercept to add token from localStorage as fallback
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("chat_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ─── Auth ────────────────────────────────────────────────
export const authAPI = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  getMe: () => api.get("/auth/me"),
};

// ─── Users ───────────────────────────────────────────────
export const userAPI = {
  search: (query: string) => api.get(`/users?search=${query}`),
  getById: (id: string) => api.get(`/users/${id}`),
};

// ─── Chats ───────────────────────────────────────────────
export const chatAPI = {
  fetchAll: () => api.get("/chats"),
  accessChat: (userId: string) => api.post("/chats", { userId }),
  createGroup: (name: string, users: string[]) =>
    api.post("/chats/group", { name, users }),
  addToGroup: (chatId: string, userId: string) =>
    api.put("/chats/group/add", { chatId, userId }),
  removeFromGroup: (chatId: string, userId: string) =>
    api.put("/chats/group/remove", { chatId, userId }),
};

// ─── Messages ────────────────────────────────────────────
export const messageAPI = {
  fetch: (chatId: string, page = 1, limit = 30) =>
    api.get(`/messages/${chatId}?page=${page}&limit=${limit}`),
  send: (data: FormData) =>
    api.post("/messages", data, {
      headers: { "Content-Type": undefined },
    }),
  sendText: (chatId: string, content: string, tempId?: string) =>
    api.post("/messages", { chatId, content, tempId }),
  markAsRead: (chatId: string) => api.put(`/messages/read/${chatId}`),
};

export default api;
