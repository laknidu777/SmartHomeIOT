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
  const [homeId, setHomeId] = useState(null);
  const [hubs, setHubs] = useState([]);
  const [selectedHub, setSelectedHub] = useState(null);

  const [assignedDevices, setAssignedDevices] = useState([]);
  const [unassignedDevices, setUnassignedDevices] = useState([]);
  const [activeTab, setActiveTab] = useState("assigned");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const [hubName, setHubName] = useState("");
  const [hubSsid, setHubSsid] = useState("");
  const [hubPassword, setHubPassword] = useState("");
  const [hubIdInput, setHubIdInput] = useState("");

  const getAuthAxios = async () => {
    const token = await AsyncStorage.getItem("token");
    return axios.create({
      baseURL: API,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  };

  useEffect(() => {
    const load = async () => {
      const storedHomeId = await AsyncStorage.getItem("homeId");
      setHomeId(storedHomeId);
      await fetchAll(storedHomeId);
    };
    load();
  }, []);

  const fetchAll = async (homeId) => {
    try {
      setLoading(true);
      const api = await getAuthAxios();

      const [hubRes, unassignedRes] = await Promise.all([
        api.get(`/hubs/by-home/${homeId}`),
        api.get(`/hubs/unassigned/${homeId}`)
      ]);

      setHubs(hubRes.data);
      setUnassignedDevices(unassignedRes.data);

      if (hubRes.data.length > 0) {
        setSelectedHub(hubRes.data[0]);
        fetchDevicesByHub(hubRes.data[0].hubId);
      }

    } catch (err) {
      console.error(err);
      Toast.show({ type: "error", text1: "Failed to load hub data" });
    } finally {
      setLoading(false);
    }
  };

  const fetchDevicesByHub = async (hubId) => {
    try {
      const api = await getAuthAxios();
      const res = await api.get(`/hubs/${hubId}/devices`);
      setAssignedDevices(res.data);
    } catch (err) {
      console.error(err);
      Toast.show({ type: "error", text1: "Failed to load assigned devices" });
    }
  };

  const refresh = () => {
    if (homeId) fetchAll(homeId);
  };

  const assignDevice = async (espId) => {
    try {
      const api = await getAuthAxios();
      await api.put(`/hubs/${selectedHub.hubId}/devices/${espId}`);
      Toast.show({ type: "success", text1: "Device assigned!" });
      refresh();
    } catch (err) {
      Toast.show({ type: "error", text1: "Failed to assign device" });
    }
  };

  const unassignDevice = async (espId) => {
    try {
      const api = await getAuthAxios();
      await api.delete(`/hubs/${selectedHub.hubId}/devices/${espId}`);
      Toast.show({ type: "success", text1: "Device unassigned!" });
      refresh();
    } catch (err) {
      Toast.show({ type: "error", text1: "Failed to unassign device" });
    }
  };

  const submitNewHub = async () => {
    try {
      const api = await getAuthAxios();
      await api.post(`/hubs/register`, {
        hubId: hubIdInput,
        name: hubName,
        ssid: hubSsid,
        password: hubPassword,
        homeId
      });
      Toast.show({ type: "success", text1: "Hub created!" });
      setModalVisible(false);
      refresh();
    } catch (err) {
      Toast.show({ type: "error", text1: "Failed to create hub" });
    }
  };

  const deleteHub = async () => {
    Alert.alert("Delete Hub", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", onPress: async () => {
          try {
            const api = await getAuthAxios();
            await api.delete(`/hubs/${selectedHub.hubId}`);
            Toast.show({ type: "success", text1: "Hub deleted!" });
            setSelectedHub(null);
            refresh();
          } catch (err) {
            Toast.show({ type: "error", text1: "Failed to delete hub" });
          }
        }
      }
    ]);
  };

  // ✅ Define DeviceCard component to fix the error
  const DeviceCard = ({ device, assigned }) => (
    <View style={styles.deviceCard}>
      <Text style={styles.deviceText}>{device.name} ({device.espId})</Text>
      <TouchableOpacity
        style={styles.assignButton}
        onPress={() => assigned ? unassignDevice(device.espId) : assignDevice(device.espId)}
      >
        <Text style={{ color: "white" }}>{assigned ? "Unassign" : "Assign"}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? <ActivityIndicator size="large" /> : (
        <>
          <View style={styles.tabHeader}>
            <TouchableOpacity onPress={() => setActiveTab("assigned")} style={[styles.tab, activeTab === "assigned" && styles.activeTab]}>
              <Text style={styles.tabText}>Assigned</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab("unassigned")} style={[styles.tab, activeTab === "unassigned" && styles.activeTab]}>
              <Text style={styles.tabText}>Unassigned</Text>
            </TouchableOpacity>
          </View>

          <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
            {activeTab === "assigned" && assignedDevices.map((device, idx) => (
              <DeviceCard key={idx} device={device} assigned />
            ))}
            {activeTab === "unassigned" && unassignedDevices.map((device, idx) => (
              <DeviceCard key={idx} device={device} />
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
            <Ionicons name="add" size={30} color="white" />
          </TouchableOpacity>

          <Modal visible={modalVisible} transparent animationType="slide">
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <TextInput placeholder="Hub ID" style={styles.input} onChangeText={setHubIdInput} />
                <TextInput placeholder="Name" style={styles.input} onChangeText={setHubName} />
                <TextInput placeholder="SSID" style={styles.input} onChangeText={setHubSsid} />
                <TextInput placeholder="Password" style={styles.input} secureTextEntry onChangeText={setHubPassword} />

                <TouchableOpacity style={styles.modalButton} onPress={submitNewHub}>
                  <Text style={{ color: "white" }}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                  <Text>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  tabHeader: { flexDirection: "row", marginBottom: 10 },
  tab: { flex: 1, padding: 10, alignItems: "center", backgroundColor: "#ccc" },
  activeTab: { backgroundColor: "#007bff" },
  tabText: { color: "white", fontWeight: "bold" },
  deviceCard: { flexDirection: "row", justifyContent: "space-between", padding: 15, marginVertical: 5, backgroundColor: "#eee", borderRadius: 8 },
  deviceText: { fontSize: 16 },
  assignButton: { backgroundColor: "#007bff", padding: 8, borderRadius: 5 },
  fab: { position: "absolute", bottom: 20, right: 20, backgroundColor: "#007bff", borderRadius: 30, padding: 15 },
  modalContainer: { flex: 1, justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modalContent: { backgroundColor: "white", margin: 20, padding: 20, borderRadius: 10 },
  input: { borderBottomWidth: 1, marginBottom: 10 },
  modalButton: { backgroundColor: "#007bff", padding: 10, alignItems: "center", borderRadius: 5, marginTop: 10 },
  cancelButton: { marginTop: 10, alignItems: "center" }
});
