import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../utils/api";
import { Picker } from "@react-native-picker/picker"; // 👈 Make sure this is installed

export default function DevicePage() {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState({ name: "", espId: "", type: "", roomId: "" });

  const fetchRooms = async () => {
    const token = await AsyncStorage.getItem("token");
    const homeId = await AsyncStorage.getItem("homeId");
    try {
      const res = await api.get(`/api/rooms/${homeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRooms(res.data);
    } catch (err) {
      console.error("❌ Failed to fetch rooms:", err);
    }
  };

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      const res = await api.get("/api/devices/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDevices(res.data);
    } catch (err) {
      console.error("❌ Failed to fetch devices:", err);
      Toast.show({ type: "error", text1: "Failed to load devices" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
    fetchRooms();
  }, []);

  const openAddModal = () => {
    setSelectedDevice(null);
    setForm({ name: "", espId: "", type: "", roomId: "" });
    setModalVisible(true);
  };

  const openEditModal = (device) => {
    setSelectedDevice(device);
    setForm({ name: device.name, espId: device.espId, type: device.type, roomId: device.roomId });
    setModalVisible(true);
  };

  const updateDevice = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const url = selectedDevice
        ? `/api/devices/update/${selectedDevice.id}`
        : "/api/devices";
      const method = selectedDevice ? "put" : "post";

      const res = await api[method](url, form, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Toast.show({ type: "success", text1: selectedDevice ? "Device updated" : "Device added" });
      setModalVisible(false);
      fetchDevices();
    } catch (err) {
      console.error("❌ Save error:", err);
      Toast.show({ type: "error", text1: "Failed to save device" });
    }
  };

  const confirmDelete = (device) => {
    Alert.alert("Delete Device", `Are you sure to delete ${device.name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteDevice(device),
      },
    ]);
  };

  const deleteDevice = async (device) => {
    try {
      const token = await AsyncStorage.getItem("token");
      await api.delete(`/api/devices/delete/${device.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Toast.show({ type: "success", text1: "Device deleted" });
      fetchDevices();
    } catch (err) {
      console.error("❌ Delete error:", err);
      Toast.show({ type: "error", text1: "Failed to delete device" });
    }
  };

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4299e1" />
        <Text style={styles.loadingText}>Loading devices...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Your Devices</Text>

        {devices.map((device) => (
          <View key={device.id} style={styles.deviceCard}>
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceName}>{device.name}</Text>
              <Text style={styles.deviceDetails}>ESP ID: {device.espId}</Text>
              <Text style={styles.deviceDetails}>Type: {device.type}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => openEditModal(device)}>
                <Ionicons name="create-outline" size={24} color="#4299e1" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => confirmDelete(device)}>
                <Ionicons name="trash-outline" size={24} color="#e53e3e" style={{ marginLeft: 16 }} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* ➕ Floating Add Button */}
      <TouchableOpacity style={styles.fab} onPress={openAddModal}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>

      {/* Modal */}
      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {selectedDevice ? "Edit Device" : "Add Device"}
            </Text>

            <TextInput
              placeholder="Device Name"
              style={styles.input}
              value={form.name}
              onChangeText={(text) => handleChange("name", text)}
            />
            <TextInput
              placeholder="ESP ID"
              style={styles.input}
              value={form.espId}
              onChangeText={(text) => handleChange("espId", text)}
            />
            <TextInput
              placeholder="Type"
              style={styles.input}
              value={form.type}
              onChangeText={(text) => handleChange("type", text)}
            />

            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={form.roomId}
                onValueChange={(value) => handleChange("roomId", value)}
              >
                <Picker.Item label="Select Room" value="" />
                {rooms.map((room) => (
                  <Picker.Item key={room.id} label={room.name} value={room.id} />
                ))}
              </Picker>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={updateDevice}>
                <Text style={styles.saveText}>
                  {selectedDevice ? "Update" : "Add"}
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
  container: { flex: 1, backgroundColor: "#f5f7fb" },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 16, color: "#2d3748" },
  deviceCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  deviceInfo: { flex: 1 },
  deviceName: { fontSize: 18, fontWeight: "600", color: "#2d3748" },
  deviceDetails: { color: "#718096", fontSize: 14 },
  actions: { flexDirection: "row", alignItems: "center" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "#00000088",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
    color: "#2d3748",
  },
  input: {
    backgroundColor: "#f7fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    color: "#2d3748",
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderColor: "#e2e8f0",
    borderWidth: 1,
    backgroundColor: "#f7fafc",
    width: "48%",
    alignItems: "center",
  },
  cancelText: { color: "#718096", fontWeight: "600" },
  saveButton: {
    backgroundColor: "#4299e1",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    width: "48%",
    alignItems: "center",
  },
  saveText: { color: "white", fontWeight: "600" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f7fb",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#718096",
    fontWeight: "500",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    backgroundColor: "#06b6d4",
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },
  fabText: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
    marginTop: -1,
  },
});
