import React, { useEffect, useState, useRef } from 'react';
import {
  ScrollView, View, Text, StyleSheet, TouchableOpacity, Switch,
  Alert, Modal, Pressable, ActivityIndicator, Animated, Easing,TextInput
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
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [currentDevice, setCurrentDevice] = useState(null);

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
  const token = await AsyncStorage.getItem("token");
  const newState = device.isOn ? 0 : 1;

  // For doorlock, ask PIN first
  if (device.type === 'doorlock') {
    setCurrentDevice({ ...device, requestedState: newState }); // Save desired state
    setPinModalVisible(true);
    return;
  }

  try {
    const res = await api.patch(
      `/api/devices/${device.id}/state`,
      { state: newState },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!res?.data) throw new Error("Invalid response");

    updateDeviceState(device.id, !!res.data.isOn);
  } catch (err) {
    console.error("❌ Failed to toggle device:", err);
    Alert.alert("Error", "Toggle failed. Try again.");
  }
};
const submitPinToggle = async () => {
  if (!pinInput.trim() || !currentDevice) return Alert.alert("Enter a valid PIN");

  try {
    const token = await AsyncStorage.getItem("token");
    const newState = currentDevice.requestedState ?? (currentDevice.isOn ? 0 : 1);

    const res = await api.patch(
      `/api/devices/${currentDevice.id}/state`,
      { state: newState, pin: pinInput },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (res?.status === 200) {
      updateDeviceState(currentDevice.id, !!res.data.isOn);
      Alert.alert(`${currentDevice.name} ${newState ? 'Unlocked' : 'Locked'}`);
    } else {
      Alert.alert("Incorrect PIN", "PIN is incorrect.");
    }
  } catch (err) {
    console.error("❌ PIN toggle failed:", err);
    Alert.alert("Toggle failed via PIN. Please retry.");
  } finally {
    setPinModalVisible(false);
    setPinInput('');
    setCurrentDevice(null);
  }
};


  // Helper function to update device state in UI
  const updateDeviceState = (deviceId, isOn) => {
  setDevicesByRoom(prev => {
    const updated = { ...prev };
    for (const roomId in updated) {
      updated[roomId] = updated[roomId].map(device =>
        device.id === deviceId ? { ...device, isOn } : device
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
                      <Switch value={device.isOn} onValueChange={() => toggleDevice(device)} />
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
        <Modal
        transparent={true}
        animationType="fade"
        visible={pinModalVisible}
        onRequestClose={() => setPinModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Security Verification</Text>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={() => setPinModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              <Text style={styles.deviceNameText}>
                {currentDevice?.name || 'Door Lock'}
              </Text>
              
              <Text style={styles.pinInstructions}>
                Please enter your 4-digit security PIN to {currentDevice?.isOn ? 'lock' : 'unlock'}
              </Text>
              
              <TextInput
                style={styles.pinInput}
                placeholder="• • • • • •"
                keyboardType="numeric"
                secureTextEntry
                value={pinInput}
                onChangeText={setPinInput}
                maxLength={6}
                autoFocus
              />
              
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setPinModalVisible(false);
                    setPinInput('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    pinInput.length < 4 && styles.submitButtonDisabled
                  ]}
                  onPress={submitPinToggle}
                  disabled={pinInput.length < 4}
                >
                  <Text style={styles.submitButtonText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    backgroundColor: '#4299e1',
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 24,
  },
  modalContent: {
    padding: 20,
    alignItems: 'center',
  },
  deviceNameText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 10,
  },
  pinInstructions: {
    textAlign: 'center',
    color: '#718096',
    marginBottom: 20,
    fontSize: 16,
  },
  pinInput: {
    width: '70%',
    height: 50,
    borderWidth: 1,
    borderColor: '#cbd5e0',
    borderRadius: 8,
    fontSize: 20,
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 24,
    backgroundColor: '#f7fafc',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    padding: 12,
    borderRadius: 8,
    width: '45%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e0',
  },
  cancelButtonText: {
    color: '#4a5568',
    fontWeight: '600',
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#4299e1',
    padding: 12,
    borderRadius: 8,
    width: '45%',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#a0aec0',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
