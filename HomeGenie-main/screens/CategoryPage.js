import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import useRoleGuard from "../hooks/useRoleGuard";

export default function CategoryPage({ navigation }) {
  useRoleGuard(["SuperAdmin"]);
  const [rooms, setRooms] = useState([]);
  const [roomName, setRoomName] = useState("");
  const [editingRoom, setEditingRoom] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRooms = async () => {
    setIsLoading(true);
    try {
      const homeId = await AsyncStorage.getItem("homeId");
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`http://192.168.8.141:5000/api/rooms/${homeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setRooms(data);
      } else {
        console.warn("No rooms returned:", data);
      }
    } catch (err) {
      console.error("Error fetching rooms:", err);
    } finally {
      setIsLoading(false);
    }
  };

 const handleSaveRoom = async () => {
  const token = await AsyncStorage.getItem("token");
  const homeId = await AsyncStorage.getItem("homeId");
  if (!roomName.trim()) return Alert.alert("Room name is required");

  try {
    const method = editingRoom ? "PATCH" : "POST";
    const url = editingRoom
      ? `http://192.168.8.141:5000/api/rooms/${editingRoom.id}`
      : "http://192.168.8.141:5000/api/rooms/create";

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: roomName, houseId: homeId }),
    });

    const contentType = res.headers.get("content-type");
    const isJson = contentType && contentType.includes("application/json");
    const data = isJson ? await res.json() : null;

    if (res.ok) {
      Toast.show({
        type: "success",
        text1: `Room ${editingRoom ? "updated" : "added"} successfully`,
      });
      setModalVisible(false);
      setRoomName("");
      setEditingRoom(null);
      fetchRooms();
    } else {
      Alert.alert("Failed to save room", data?.error || "Unknown error");
    }
  } catch (err) {
    console.error("Save error:", err);
    Alert.alert("Error", "Failed to save room");
  }
};

  const handleDeleteRoom = async (roomId) => {
    const token = await AsyncStorage.getItem("token");
    Alert.alert("Confirm Delete", "Are you sure you want to delete this room?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await fetch(`http://192.168.8.141:5000/api/rooms/${roomId}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              Toast.show({ type: "success", text1: "Room deleted successfully" });
              fetchRooms();
            } else {
              Alert.alert("Delete failed", "Could not delete room");
            }
          } catch (err) {
            console.error("Delete error:", err);
            Alert.alert("Error", "Failed to delete room");
          }
        },
      },
    ]);
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const openEditModal = (room) => {
    setEditingRoom(room);
    setRoomName(room.name);
    setModalVisible(true);
  };

  const openAddModal = () => {
    setEditingRoom(null);
    setRoomName("");
    setModalVisible(true);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f5f7fb" }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Rooms</Text>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#06b6d4" />
            <Text style={styles.loadingText}>Loading rooms...</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {rooms.map((room) => (
              <View key={room.id} style={styles.tile}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tileText}>{room.name}</Text>
                </View>
                <View style={styles.actionsRow}>
                  <TouchableOpacity onPress={() => openEditModal(room)}>
                    <Ionicons name="create-outline" size={22} color="#4299e1" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteRoom(room.id)}>
                    <Ionicons name="trash-outline" size={22} color="#e53e3e" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={openAddModal}>
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingRoom ? "Edit Room" : "New Room"}
            </Text>
            <TextInput
              placeholder="Enter room name"
              value={roomName}
              onChangeText={setRoomName}
              style={styles.modalInput}
              placeholderTextColor="#a0aec0"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={{ color: "#718096" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveRoom}>
                <Text style={{ color: "white" }}>
                  {editingRoom ? "Update" : "Add"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#f5f5f5",
    flexGrow: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#2d3748",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  tile: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    justifyContent: "space-between",
    height: 110,
  },
  tileText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d3748",
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#718096",
    fontWeight: "500",
  },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 30,
    backgroundColor: "#06b6d4",
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "#00000088",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    width: "85%",
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  modalInput: {
    borderColor: "#e2e8f0",
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 16,
    color: "#2d3748",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    padding: 12,
    borderRadius: 8,
    borderColor: "#ccc",
    borderWidth: 1,
    flex: 1,
    marginRight: 10,
    alignItems: "center",
  },
  saveButton: {
    backgroundColor: "#06b6d4",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
  },
});
