import { io } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

let socket = null;
let reconnectAttempts = 0;

const MAX_RECONNECT_ATTEMPTS = 10;
const SOCKET_URL = "http://192.168.8.141:5000"; // change if needed

export const connectSocket = async () => {
  const espId = await AsyncStorage.getItem("espId");
  if (!espId) return console.warn("No ESP ID in storage");

  if (socket && socket.connected) return socket;

  socket = io(SOCKET_URL, {
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    reconnectionDelay: 2000,
    timeout: 10000,
  });

  socket.on("connect", () => {
    console.log("🔌 WebSocket connected:", socket.id);
    socket.emit("registerDevice", { espId });
    reconnectAttempts = 0;
  });

  socket.on("disconnect", (reason) => {
    console.warn("❌ Socket disconnected:", reason);
  });

  socket.on("connect_error", (err) => {
    reconnectAttempts++;
    console.error("🚫 Socket connection error:", err.message);
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.warn("❗ Max reconnect attempts reached");
    }
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    console.log("🔌 Socket disconnected manually");
  }
};
