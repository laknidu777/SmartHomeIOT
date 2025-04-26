// socket.js
import io from "socket.io-client"; // Changed from import { io } to import io
import AsyncStorage from "@react-native-async-storage/async-storage";

const SOCKET_URL = "http://192.168.8.141:5000";
let socket = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

export const connectSocket = async () => {
  try {
    if (socket && socket.connected) {
      console.log("🔌 Socket already connected:", socket.id);
      return socket;
    }
    
    console.log("🔄 Attempting to connect to socket:", SOCKET_URL);
    
    socket = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: 2000,
      timeout: 10000,
    });

    socket.on("connect", async () => {
      console.log("🔌 WebSocket connected:", socket.id);
      reconnectAttempts = 0;

      const espId = await AsyncStorage.getItem("espId");
      const homeId = await AsyncStorage.getItem("homeId");

      // Register either as device or dashboard
      if (espId) {
        socket.emit("registerDevice", { espId });
        console.log("📱 Registered as device:", espId);
      } else if (homeId) {
        socket.emit("registerDashboard", { homeId });
        console.log("🏠 Registered as dashboard:", homeId);
      } else {
        console.warn("⚠️ No espId or homeId found for registration");
      }
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
  } catch (error) {
    console.error("💥 Error in connectSocket:", error);
    return null;
  }
};

export const getSocket = () => {
  if (!socket || !socket.connected) {
    console.warn("⚠️ Socket not connected when getSocket() called");
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    console.log("🔌 Socket disconnected manually");
    socket = null;
  }
};