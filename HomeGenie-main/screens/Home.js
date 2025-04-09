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
  const scrollRef = useRef(null);
  // Store room positions for better scrolling
  const [roomPositions, setRoomPositions] = useState([]);

  useEffect(() => {
    fetchCategoriesAndDevices();
  }, []);

  const fetchCategoriesAndDevices = async () => {
    try {
      const homeId = await AsyncStorage.getItem("homeId");
      const user = auth.currentUser;
      if (!user || !homeId) return;
      const idToken = await user.getIdToken();

      const res = await fetch(`http://localhost:5000/api/categories?homeId=${homeId}`, {
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
          `http://localhost:5000/api/items?homeId=${homeId}&categoryId=${category.id}`,
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
    }
  };

  const toggleDevice = async (device) => {
    try {
      const newStatus = !device.status;
      // Note: rtdb is not defined in your original code, you'll need to import it
      await set(ref(rtdb, `device/${device.espId}`), newStatus);
      
      // Create a deep copy of devices to ensure state update triggers
      setDevicesByRoom(prev => {
        const updated = {...prev};
        const roomId = Object.keys(updated).find(roomId => 
          updated[roomId].some(d => d.id === device.id)
        );
        
        if (roomId) {
          updated[roomId] = updated[roomId].map(d => 
            d.id === device.id ? {...d, status: newStatus} : d
          );
        }
        
        return updated;
      });
    } catch (error) {
      console.error('Failed to toggle device:', error);
    }
  };

  // Handle room position measurement for accurate scrolling
  const measureRoomPosition = (y, index) => {
    const positions = [...roomPositions];
    positions[index] = y;
    setRoomPositions(positions);
  };

  const scrollToRoom = (index) => {
    setSelectedRoomIndex(index);
    
    // Use the measured position if available, otherwise estimate
    const yOffset = roomPositions[index] || index * 350;
    
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ y: yOffset, animated: true });
    }
  };

  const handleMenuAction = (action, device) => {
    setMenuDevice(null);
    Alert.alert(`${action}`, `Performing "${action}" on ${device.name}`);
  };

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
          <Text style={styles.title}>Smart Dashboard</Text>

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
                <Text style={styles.roomName}>{room.name}</Text>
                <Text style={styles.deviceCount}>
                  {devicesByRoom[room.id]?.length || 0} devices
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Devices by Room */}
          {rooms.map((room, index) => (
            <View 
              key={room.id} 
              onLayout={(event) => {
                // Measure and store Y position of each room section
                const { y } = event.nativeEvent.layout;
                measureRoomPosition(y, index);
              }}
            >
              <Text style={styles.sectionTitle}>{room.name} Devices</Text>
              {devicesByRoom[room.id]?.length > 0 ? (
                devicesByRoom[room.id].map((device) => (
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
                ))
              ) : (
                <Text style={styles.emptyMessage}>No devices found</Text>
              )}
            </View>
          ))}
          
          {/* Add padding at the bottom to ensure content isn't hidden by footer */}
          <View style={styles.footerSpace} />
        </View>
      </ScrollView>

      {/* 3-dot menu */}
      <Modal visible={!!menuDevice} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.menuPopup}>
            {["Configure", "Move", "Delete"].map((action) => (
              <Pressable
                key={action}
                style={styles.menuItem}
                onPress={() => handleMenuAction(action, menuDevice)}
              >
                <Text>{action}</Text>
              </Pressable>
            ))}
            <Pressable onPress={() => setMenuDevice(null)} style={styles.menuItem}>
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
    // This ensures content is scrollable and not constrained
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
  roomName: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#2d3748',
  },
  deviceCount: { 
    fontSize: 14, 
    color: '#718096',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 10,
    marginTop: 10,
  },
  deviceCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },
  menuDots: { 
    fontSize: 20, 
    marginLeft: 15, 
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
    height: 80, // Adjust based on your footer height
  },
});