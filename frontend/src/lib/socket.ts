"use client";

import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: false,
    });
  }
  return socket;
};

export const connectSocket = (userData: { _id: string }) => {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
    s.emit("setup", userData);
  }
  return s;
};

export const disconnectSocket = () => {
  if (socket?.connected) {
    socket.disconnect();
  }
};
