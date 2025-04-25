import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, Modal, TextInput,
  TouchableOpacity, ActivityIndicator, Alert, RefreshControl
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";

const API = "http://192.168.8.141:5000/api";

export default function HubPage() {
  const [hubId, setHubId] = useState("");
  const [assignedDevices, setAssignedDevices] = useState([]);
  const [unassignedDevices, setUnassignedDevices] = useState([]);
  const [activeTab, setActiveTab] = useState("assigned");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [deviceName, setDeviceName] = useState("");
  const [deviceType, setDeviceType] = useState("");
  const [hubSsid, setHubSsid] = useState("");
  const [hubPassword, setHubPassword] = useState("");


  useEffect(() => {
    const loadHubIdAndDevices = async () => {
      const storedHubId = await AsyncStorage.getItem("hubId");
      setHubId(storedHubId);
      await fetchDevices(storedHubId);
    };

    loadHubIdAndDevices();
  }, []);
  const fetchHubDetails = async (hubId) => {
    try {
      const res = await axios.get(`${API}/hubs/${hubId}`);
      setHubSsid(res.data.ssid);
      setHubPassword(res.data.password);
    } catch {
      Toast.show({ type: "error", text1: "Failed to load hub info" });
    }
  };
  
  const fetchDevices = async (hubId) => {
    try {
      setLoading(true);
      const assigned = await axios.get(`${API}/hubs/${hubId}/devices`);
      const all = await axios.get(`${API}/devices`);
      const unassigned = all.data.filter(d => d.assignedHubId === null);

      setAssignedDevices(assigned.data);
      setUnassignedDevices(unassigned);
    } catch (err) {
      Toast.show({ type: "error", text1: "Failed to load devices" });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDevices(hubId);
    setRefreshing(false);
  };

  const handleAssign = async (device) => {
    try {
      await axios.post(`${API}/devices/${device.espId}/assign-hub`, {
        hubId,
        hubSsid: "CentralHub-Setup",
        hubPassword: "12345678",
      });
      Toast.show({ type: "success", text1: "Device assigned to hub" });
      await fetchDevices(hubId);
    } catch {
      Toast.show({ type: "error", text1: "Assignment failed" });
    }
  };

  const handleDelete = async (espId) => {
    Alert.alert("Unassign Device", "Are you sure?", [
      { text: "Cancel" },
      {
        text: "Yes",
        onPress: async () => {
          try {
            await axios.delete(`${API}/hubs/${hubId}/devices/${espId}`);
            Toast.show({ type: "success", text1: "Device unassigned" });
            await fetchDevices(hubId);
          } catch {
            Toast.show({ type: "error", text1: "Failed to unassign" });
          }
        },
      },
    ]);
  };

  const handleEdit = (device) => {
    setSelectedDevice(device);
    setDeviceName(device.name);
    setDeviceType(device.type);
    setModalVisible(true);
  };

  const handleUpdate = async () => {
    try {
      await axios.put(`${API}/hubs/${hubId}/devices/${selectedDevice.espId}`, {
        name: deviceName,
        type: deviceType,
      });
      Toast.show({ type: "success", text1: "Device updated" });
      setModalVisible(false);
      await fetchDevices(hubId);
    } catch {
      Toast.show({ type: "error", text1: "Update failed" });
    }
  };

  const renderDevice = (device, isAssigned = true) => (
    <View key={device.espId} style={styles.card}>
      <Text style={styles.cardTitle}>{device.name || "Unnamed Device"}</Text>
      <Text>ESP: {device.espId}</Text>
      <Text>Type: {device.type}</Text>

      <View style={styles.cardActions}>
        {isAssigned ? (
          <>
            <TouchableOpacity onPress={() => handleEdit(device)}>
              <Ionicons name="create-outline" size={22} color="black" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(device.espId)}>
              <Ionicons name="trash-outline" size={22} color="red" />
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity onPress={() => handleAssign(device)}>
            <Ionicons name="add-circle-outline" size={22} color="green" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" color="#000" />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity onPress={() => setActiveTab("assigned")} style={[styles.tab, activeTab === "assigned" && styles.tabActive]}>
          <Text style={styles.tabText}>Assigned Devices</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab("unassigned")} style={[styles.tab, activeTab === "unassigned" && styles.tabActive]}>
          <Text style={styles.tabText}>Unassigned Devices</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTab === "assigned" ? assignedDevices.map(d => renderDevice(d)) : unassignedDevices.map(d => renderDevice(d, false))}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text>Edit Device</Text>
            <TextInput value={deviceName} onChangeText={setDeviceName} placeholder="Name" style={styles.input} />
            <TextInput value={deviceType} onChangeText={setDeviceType} placeholder="Type" style={styles.input} />
            <TouchableOpacity onPress={handleUpdate} style={styles.saveBtn}>
              <Text style={{ color: "#fff" }}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: "#fff" },
  tabContainer: { flexDirection: "row", justifyContent: "space-around", marginBottom: 15 },
  tab: { padding: 10, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabActive: { borderBottomColor: "blue" },
  tabText: { fontSize: 16 },
  card: { backgroundColor: "#f0f0f0", padding: 15, borderRadius: 8, marginBottom: 10 },
  cardTitle: { fontWeight: "bold", fontSize: 16, marginBottom: 5 },
  cardActions: { flexDirection: "row", gap: 20, marginTop: 10 },
  modalContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000000aa" },
  modalContent: { backgroundColor: "#fff", padding: 20, borderRadius: 10, width: "80%" },
  input: { borderWidth: 1, padding: 10, marginVertical: 10, borderRadius: 5 },
  saveBtn: { backgroundColor: "blue", padding: 10, alignItems: "center", borderRadius: 5 },
});
