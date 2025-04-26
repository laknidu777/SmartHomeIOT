import React, { useEffect, useState, useRef } from 'react';
import {
  ScrollView, View, Text, StyleSheet, TouchableOpacity, Switch,
  Alert, Modal, Pressable, ActivityIndicator, Animated, Easing
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';
import { connectSocket, getSocket } from "../utils/socket";
import StatusRow from '../components/StatusRow';
import { RefreshControl } from 'react-native';


const useBlinking = () => {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.2,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.linear,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.linear,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return opacity;
};

export default function SmartDashboard() {
  const [rooms, setRooms] = useState([]);
  const [devicesByRoom, setDevicesByRoom] = useState({});
  const [selectedRoomIndex, setSelectedRoomIndex] = useState(0);
  const [menuDevice, setMenuDevice] = useState(null);
  const [menuRoom, setMenuRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);
  const [roomPositions, setRoomPositions] = useState([]);
  const socketRef = useRef(null);
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCategoriesAndDevices(); // Your existing fetch function
    setRefreshing(false);
  };
  const fetchCategoriesAndDevices = async () => {
    setLoading(true);
    try {
      const homeId = await AsyncStorage.getItem("homeId");
      const token = await AsyncStorage.getItem("token");
      if (!token || !homeId) return;

      const res = await api.get(`/api/rooms/${homeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const roomList = res.data || [];
      setRooms(roomList);

      const devicesData = {};
      for (const room of roomList) {
        const itemRes = await api.get(`/api/devices/${room.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        devicesData[room.id] = itemRes.data || [];
      }

      setDevicesByRoom(devicesData);
    } catch (error) {
      console.error("❌ Error fetching rooms/devices:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let reconnectInterval;
  
    const initialize = async () => {
      try {
        await fetchCategoriesAndDevices();
        
        // Connect to socket and store the instance
        const socketInstance = await connectSocket();
        if (socketInstance) {
          socketRef.current = socketInstance;
          console.log("✅ Socket connection established");
          
          const homeId = await AsyncStorage.getItem("homeId");
          if (homeId) {
            socketInstance.emit("registerDashboard", { homeId });
            console.log("📤 Sent registerDashboard for:", homeId);
          } else {
            console.warn("⚠️ No homeId found for registration");
          }
          
          // Setup event listeners
          socketInstance.on("deviceStatusChange", ({ espId, isOnline }) => {
            console.log("🔁 UI received deviceStatusChange:", espId, isOnline);
  
            if (!isMounted) return;
            setDevicesByRoom(prev => {
              const updated = { ...prev };
              for (const roomId in updated) {
                updated[roomId] = updated[roomId].map(device =>
                  device.espId === espId ? { ...device, isOnline } : device
                );
              }
              return updated;
            });
          });
        } else {
          console.error("❌ Failed to initialize socket connection");
        }
      } catch (error) {
        console.error("❌ Error in socket initialization:", error);
      }
    };
  
    initialize();
    
    // Set up periodic reconnection attempts
    reconnectInterval = setInterval(async () => {
      const socket = getSocket();
      if (!socket || !socket.connected) {
        console.log("🔄 Attempting socket reconnection...");
        await connectSocket();
      }
    }, 30000); // Check every 30 seconds
  
    return () => {
      isMounted = false;
      if (reconnectInterval) clearInterval(reconnectInterval);
      if (socketRef.current) {
        try {
          socketRef.current.off("deviceStatusChange");
        } catch (err) {
          console.error("❌ Error removing event listeners:", err);
        }
      }
    };
  }, []);
  const toggleDevice = async (device) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const newStatus = !device.status;
    
      if (device.assignedHubId) {
        // Hub-controlled → send WebSocket command
        const command = newStatus ? "on" : "off";
    
        // Try to get the socket or reconnect
        let socketInstance = getSocket();
        
        // If no socket exists or not connected, try to connect
        if (!socketInstance || !socketInstance.connected) {
          console.log("🔄 Socket not ready. Attempting to connect...");
          await connectSocket();
          socketInstance = getSocket();
        }
  
        // Check if we now have a valid socket
        if (socketInstance && socketInstance.connected) {
          socketInstance.emit("hubToggleCommand", `${device.espId},${command}`);
          console.log("📤 Emitted hubToggleCommand:", device.espId, command);
          
          // Optimistically update UI
          setDevicesByRoom(prev => {
            const updated = { ...prev };
            const roomId = Object.keys(updated).find(id =>
              updated[id].some(d => d.id === device.id)
            );
            if (roomId) {
              updated[roomId] = updated[roomId].map(d =>
                d.id === device.id ? { ...d, status: newStatus } : d
              );
            }
            return updated;
          });
        } else {
          console.warn("⚠️ Socket still not connected after retry.");
          Alert.alert(
            "Connection Error", 
            "Cannot connect to hub. Please check your network connection and try again."
          );
          return;
        }
      } else {
        // Backend-controlled → call API
        const res = await api.patch(
          `/api/devices/toggle/${device.id}`,
          { message: newStatus ? "Device ON" : "Device OFF", isOn: newStatus },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res?.data) throw new Error("Invalid response");
        
        // Update UI after successful API call
        setDevicesByRoom(prev => {
          const updated = { ...prev };
          const roomId = Object.keys(updated).find(id =>
            updated[id].some(d => d.id === device.id)
          );
          if (roomId) {
            updated[roomId] = updated[roomId].map(d =>
              d.id === device.id ? { ...d, status: newStatus } : d
            );
          }
          return updated;
        });
      }
    } catch (err) {
      console.error('❌ Failed to toggle device:', err);
      Alert.alert("Error", "Failed to toggle device");
    }
  };
  
  // Helper function to update device state in UI
  const updateDeviceState = (deviceId, newStatus) => {
    setDevicesByRoom(prev => {
      const updated = { ...prev };
      const roomId = Object.keys(updated).find(id =>
        updated[id].some(d => d.id === deviceId)
      );
      if (roomId) {
        updated[roomId] = updated[roomId].map(d =>
          d.id === deviceId ? { ...d, status: newStatus } : d
        );
      }
      return updated;
    });
  };
  const scrollToRoom = (index) => {
    setSelectedRoomIndex(index);
    const yOffset = roomPositions[index] || index * 350;
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ y: yOffset, animated: true });
    }
  };

  const measureRoomPosition = (y, index) => {
    const positions = [...roomPositions];
    positions[index] = y;
    setRoomPositions(positions);
  };

  const blinkingOpacity = useBlinking();

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4299e1" />
        <Text style={{ marginTop: 12, color: '#666' }}>Loading devices...</Text>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StatusRow />
      <ScrollView
        style={styles.scrollContent}
        ref={scrollRef}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#4299e1']} // Android spinner color
            tintColor="#4299e1"   // iOS spinner color
          />
        }
      >
        <View style={styles.container}>
          <Text style={styles.title}>Dashboard</Text>

          <View style={styles.roomsGrid}>
            {rooms.map((room, index) => (
              <TouchableOpacity
                key={room.id}
                style={[styles.roomCard, index === selectedRoomIndex && styles.activeRoomCard]}
                onPress={() => scrollToRoom(index)}
              >
                <View style={styles.roomCardContent}>
                  <View>
                    <Text style={styles.roomName}>{room.name}</Text>
                    <Text style={styles.deviceCount}>{devicesByRoom[room.id]?.length || 0} devices</Text>
                  </View>
                  <TouchableOpacity onPress={() => setMenuRoom(room)}>
                    <Text style={styles.menuDots}>⋮</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {rooms.map((room, index) => (
            <View key={room.id} onLayout={(event) => measureRoomPosition(event.nativeEvent.layout.y, index)}>
              <View style={[styles.roomHeader, index === selectedRoomIndex && styles.activeRoomHeader]}>
                <Text style={[styles.roomHeaderText, { color: index === selectedRoomIndex ? 'white' : '#2d3748' }]}>
                  {room.name}
                </Text>
              </View>
              {devicesByRoom[room.id]?.length > 0 ? (
                <View style={styles.devicesGrid}>
                  {devicesByRoom[room.id].map(device => (
                    <View key={device.id} style={styles.deviceCard}>
                      <Text style={styles.deviceName}>{device.name}</Text>
                      <View style={styles.statusRow}>
                        {device.isOnline ? (
                          <View style={[styles.statusDot, { backgroundColor: 'green' }]} />
                        ) : (
                          <Animated.View style={[styles.statusDot, { backgroundColor: 'red', opacity: blinkingOpacity }]} />
                        )}
                        <Text style={styles.deviceStatus}>
                          {device.isOnline ? 'Online' : 'Offline'}
                        </Text>
                      </View>
                      <View style={styles.deviceControls}>
                        <Switch value={device.status} onValueChange={() => toggleDevice(device)} />
                        <TouchableOpacity onPress={() => setMenuDevice(device)}>
                          <Text style={styles.menuDots}>⋮</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyMessage}>No devices found</Text>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#f5f7fb' },
  scrollContent: { flex: 1 },
  scrollContentContainer: { flexGrow: 1 },
  container: { padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#2d3748' },
  roomsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
  roomCard: { backgroundColor: 'white', borderRadius: 12, padding: 16, width: '48%', marginBottom: 12, elevation: 2 },
  activeRoomCard: { borderWidth: 2, borderColor: '#4299e1' },
  roomCardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  roomName: { fontSize: 16, fontWeight: '600', color: '#2d3748' },
  deviceCount: { fontSize: 14, color: '#718096' },
  roomHeader: { backgroundColor: '#e2e8f0', paddingVertical: 8, paddingHorizontal: 16, marginBottom: 10, borderRadius: 8 },
  activeRoomHeader: { backgroundColor: '#4299e1' },
  roomHeaderText: { fontSize: 18, fontWeight: '600' },
  devicesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  deviceCard: { backgroundColor: 'white', borderRadius: 12, padding: 16, width: '48%', marginBottom: 12, elevation: 2 },
  deviceName: { fontSize: 16, fontWeight: '600', color: '#2d3748' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  deviceStatus: { fontSize: 14, color: '#718096' },
  deviceControls: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  menuDots: { fontSize: 20, color: '#666' },
  emptyMessage: { textAlign: 'center', color: '#999', padding: 10 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f7fb' },
});
