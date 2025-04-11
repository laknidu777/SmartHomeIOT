import React, { useEffect, useState, useRef } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  Pressable,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { auth } from '../firebaseConfig';
import StatusRow from '../components/StatusRow';
import { ref, set } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { height } = Dimensions.get('window');

export default function SmartDashboard() {
  const [rooms, setRooms] = useState([]);
  const [devicesByRoom, setDevicesByRoom] = useState({});
  const [selectedRoomIndex, setSelectedRoomIndex] = useState(0);
  const [menuDevice, setMenuDevice] = useState(null);
  const [menuRoom, setMenuRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);
  const [roomPositions, setRoomPositions] = useState([]);

  useEffect(() => {
    fetchCategoriesAndDevices();
  }, []);

  const fetchCategoriesAndDevices = async () => {
    setLoading(true);
    try {
      const homeId = await AsyncStorage.getItem("homeId");
      const user = auth.currentUser;
      if (!user || !homeId) return;
      const idToken = await user.getIdToken();

      const res = await fetch(`http://192.168.8.141:5000/api/categories?homeId=${homeId}`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        console.error("❌ Failed to fetch categories:", data.error);
        return;
      }

      const categoryList = data.categories || [];
      setRooms(categoryList);

      const devicesData = {};
      for (const category of categoryList) {
        const itemRes = await fetch(
          `http://192.168.8.141:5000/api/items?homeId=${homeId}&categoryId=${category.id}`,
          {
            headers: { Authorization: `Bearer ${idToken}` },
          }
        );
        const itemData = await itemRes.json();
        if (itemRes.ok) {
          devicesData[category.id] = itemData.items || [];
        }
      }

      setDevicesByRoom(devicesData);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDevice = async (device) => {
    try {
      const newStatus = !device.status;
      await set(ref(rtdb, `device/${device.espId}`), newStatus);
      setDevicesByRoom(prev => {
        const updated = { ...prev };
        const roomId = Object.keys(updated).find(roomId =>
          updated[roomId].some(d => d.id === device.id)
        );
        if (roomId) {
          updated[roomId] = updated[roomId].map(d =>
            d.id === device.id ? { ...d, status: newStatus } : d
          );
        }
        return updated;
      });
    } catch (error) {
      console.error('Failed to toggle device:', error);
    }
  };

  const measureRoomPosition = (y, index) => {
    const positions = [...roomPositions];
    positions[index] = y;
    setRoomPositions(positions);
  };

  const scrollToRoom = (index) => {
    setSelectedRoomIndex(index);
    const yOffset = roomPositions[index] || index * 350;
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ y: yOffset, animated: true });
    }
  };

  const handleDeviceMenuAction = (action, device) => {
    setMenuDevice(null);
    Alert.alert(`${action}`, `Performing "${action}" on ${device.name}`);
  };

  const handleRoomMenuAction = (action, room) => {
    setMenuRoom(null);
    Alert.alert(`${action}`, `Performing "${action}" on room ${room.name}`);
  };

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
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.container}>
          <Text style={styles.title}>Dashboard</Text>

          {/* Category Tabs */}
          <View style={styles.roomsGrid}>
            {rooms.map((room, index) => (
              <TouchableOpacity
                key={room.id}
                style={[
                  styles.roomCard,
                  index === selectedRoomIndex && styles.activeRoomCard,
                ]}
                onPress={() => scrollToRoom(index)}
              >
                <View style={styles.roomCardContent}>
                  <View>
                    <Text style={styles.roomName}>{room.name}</Text>
                    <Text style={styles.deviceCount}>
                      {devicesByRoom[room.id]?.length || 0} devices
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setMenuRoom(room)}>
                    <Text style={styles.menuDots}>⋮</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Devices by Room */}
          {rooms.map((room, index) => (
            <View
              key={room.id}
              onLayout={(event) => {
                const { y } = event.nativeEvent.layout;
                measureRoomPosition(y, index);
              }}
            >
              <View style={[
                styles.roomHeader,
                index === selectedRoomIndex && styles.activeRoomHeader
              ]}>
                <Text style={[
                  styles.roomHeaderText,
                  { color: index === selectedRoomIndex ? 'white' : '#2d3748' }
                ]}>
                  {room.name}
                </Text>
              </View>
              {devicesByRoom[room.id]?.length > 0 ? (
                <View style={styles.devicesGrid}>
                  {devicesByRoom[room.id].map((device) => (
                    <View key={device.id} style={styles.deviceCard}>
                      <View>
                        <Text style={styles.deviceName}>{device.name}</Text>
                        <Text style={styles.deviceStatus}>
                          {device.status ? 'Connected' : 'Disconnected'}
                        </Text>
                      </View>
                      <View style={styles.deviceControls}>
                        <Switch
                          value={device.status}
                          onValueChange={() => toggleDevice(device)}
                        />
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
          <View style={styles.footerSpace} />
        </View>
      </ScrollView>

      {/* Modal for Room & Device Menus */}
      <Modal visible={!!menuDevice || !!menuRoom} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.menuPopup}>
            {menuDevice && (
              <>
                {["Configure", "Move", "Delete"].map((action) => (
                  <Pressable
                    key={action}
                    style={styles.menuItem}
                    onPress={() => handleDeviceMenuAction(action, menuDevice)}
                  >
                    <Text>{action}</Text>
                  </Pressable>
                ))}
              </>
            )}
            {menuRoom && (
              <>
                {["Configure Room", "Rename Room", "Delete Room"].map((action) => (
                  <Pressable
                    key={action}
                    style={styles.menuItem}
                    onPress={() => handleRoomMenuAction(action, menuRoom)}
                  >
                    <Text>{action}</Text>
                  </Pressable>
                ))}
              </>
            )}
            <Pressable onPress={() => { setMenuDevice(null); setMenuRoom(null); }} style={styles.menuItem}>
              <Text style={{ color: 'red' }}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
  },
  container: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2d3748',
  },
  roomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  roomCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    elevation: 2,
  },
  activeRoomCard: {
    borderWidth: 2,
    borderColor: '#4299e1',
  },
  roomCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
  },
  deviceCount: {
    fontSize: 14,
    color: '#718096',
  },
  roomHeader: {
    backgroundColor: '#e2e8f0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderRadius: 8,
  },
  activeRoomHeader: {
    backgroundColor: '#4299e1',
  },
  roomHeaderText: {
    fontSize: 18,
    fontWeight: '600',
  },
  devicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  deviceCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '48%', // Two cards per row
    marginBottom: 12,
    elevation: 2,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
  },
  deviceStatus: {
    fontSize: 14,
    color: '#718096',
  },
  deviceControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  menuDots: {
    fontSize: 20,
    color: '#666',
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#999',
    padding: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000088',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuPopup: {
    width: 200,
    backgroundColor: 'white',
    paddingVertical: 10,
    borderRadius: 10,
    elevation: 10,
  },
  menuItem: {
    padding: 12,
    alignItems: 'center',
  },
  footerSpace: {
    height: 80,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fb',
  },
  
});