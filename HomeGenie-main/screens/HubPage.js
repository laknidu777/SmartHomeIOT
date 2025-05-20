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
  const [editMode, setEditMode] = useState(false);
  const isHubOnline = (lastSeen) => {
    if (!lastSeen) return false;
    const secondsAgo = (Date.now() - new Date(lastSeen).getTime()) / 1000;
    return secondsAgo < 65;
  };
  


  const getAuthAxios = async () => {
    const token = await AsyncStorage.getItem("token");
    return axios.create({
      baseURL: API,
      headers: { Authorization: `Bearer ${token}` }
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

  const fetchAll = async () => {
  try {
    setLoading(true);
    const storedHomeId = await AsyncStorage.getItem("homeId");
    setHomeId(storedHomeId);

    const api = await getAuthAxios();
    const res = await api.get(`/hubs/${storedHomeId}`);
    const hubList = res.data || [];

    setHubs(hubList);

    if (hubList.length > 0) {
      const firstHub = hubList[0];
      setSelectedHub(firstHub);
      fetchDevicesByHub(firstHub.espId);
    }
  } catch (err) {
    console.error("❌ Failed to fetch hubs:", err);
    Toast.show({ type: "error", text1: "Failed to load hubs" });
  } finally {
    setLoading(false);
  }
};


  const fetchDevicesByHub = async (espId) => {
  try {
    const api = await getAuthAxios();
    const res = await api.get(`/devices/hub/${espId}/assignment-overview`);

    setAssignedDevices(res.data.assignedDevices || []);
    setUnassignedDevices(res.data.unassignedDevices || []);
  } catch (err) {
    console.error("❌ Failed to fetch hub devices:", err);
    Toast.show({ type: "error", text1: "Failed to fetch hub devices" });
  }
};



  const refresh = () => {
    if (homeId) fetchAll(homeId);
  };
  const unassignDevice = async (espId) => {
    try {
      const api = await getAuthAxios();
      await api.patch(`/devices/${espId}/unassign-hub`);
      Toast.show({ type: "success", text1: "Device unassigned!" });
      refresh();
    } catch (err) {
      console.error(err);
      Toast.show({ type: "error", text1: "Failed to unassign device" });
    }
  };
const submitNewHub = async () => {
  if (!hubIdInput.trim() || !hubName.trim() || !hubSsid.trim() || !hubPassword.trim()) {
    Alert.alert("Missing Fields", "Please fill in all required fields.");
    return;
  }

  try {
    const api = await getAuthAxios();

    const payload = {
      espId: hubIdInput,             // ✅ backend expects this
      name: hubName,
      ssid: hubSsid,
      password: hubPassword,
      houseId: homeId                // ✅ not `homeId`
    };

    //console.log("📤 Submitting new hub:", payload);

    await api.post(`/hubs/create`, payload);

    Toast.show({ type: "success", text1: "Hub created!" });
    setModalVisible(false);
    setHubIdInput("");
    setHubName("");
    setHubSsid("");
    setHubPassword("");
    refresh();
  } catch (err) {
    console.error("❌ Failed to create hub:", err.response?.data || err.message);
    Toast.show({ type: "error", text1: "Failed to create hub" });
  }
};

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
  const updateHub = async () => {
    try {
      const api = await getAuthAxios();
      await api.patch(`/hubs/${hubIdInput}`, {
        name: hubName,
        ssid: hubSsid,
        password: hubPassword
      });
      Toast.show({ type: "success", text1: "Hub updated!" });
      setModalVisible(false);
      setEditMode(false);
      refresh();
    } catch (err) {
      Toast.show({ type: "error", text1: "Failed to update hub" });
    }
  };
  const deleteHub = async () => {
    Alert.alert("Delete Hub", "Are you sure you want to delete this hub?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive", onPress: async () => {
          try {
            const api = await getAuthAxios();
            await api.delete(`/hubs/${hubIdInput}`);
            Toast.show({ type: "success", text1: "Hub deleted!" });
            setModalVisible(false);
            setEditMode(false);
            setSelectedHub(null);
            refresh();
          } catch (err) {
            Toast.show({ type: "error", text1: "Failed to delete hub" });
          }
        }
      }
    ]);
  };
  
  return (
    <View style={styles.container}>
      {loading ? <ActivityIndicator size="large" /> : (
        <>
          <Text style={styles.title}>Hub Management</Text>

          {/* Hub Selector */}
          <ScrollView horizontal style={styles.hubScroll} showsHorizontalScrollIndicator={false}>
            {hubs.map((hub) => (
              <TouchableOpacity
                key={hub.hubId}
                style={[
                  styles.hubChip,
                  selectedHub?.hubId === hub.hubId && styles.activeHubChip
                ]}
                onPress={() => {
                  setSelectedHub(hub);
                  fetchDevicesByHub(hub.espId || hub.hubId)
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={{ color: "white" }}>{hub.name || hub.hubId}</Text>
                  <View style={[styles.statusDot, {
                    backgroundColor: isHubOnline(hub.lastSeen) ? 'green' : 'red'
                  }]} />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Hub Info Panel */}
          {selectedHub && (
            <View style={styles.infoPanel}>
              <View style={styles.infoHeader}>
                <Text style={styles.infoTitle}>Hub Info</Text>
                <TouchableOpacity onPress={() => {
                  setHubIdInput(selectedHub.id); // ✅ Use internal DB id, not espId
                  setHubName(selectedHub.name || "");
                  setHubSsid(selectedHub.hubSsid || "");
                  setHubPassword(selectedHub.hubPassword || "");
                  setEditMode(false);
                  setModalVisible(true);
                }}>
                  <Ionicons name="create-outline" size={22} color="#4a5568" />
                </TouchableOpacity>
              </View>
              <Text style={styles.infoText}>Name: {selectedHub.name}</Text>
              <Text style={styles.infoText}>Hub ID: {selectedHub.espId || selectedHub.hubId}</Text>
              <Text style={styles.infoText}>SSID: {selectedHub.hubSsid}</Text>
            </View>
          )}


          {/* Tabs */}
          <View style={styles.tabHeader}>
            <TouchableOpacity onPress={() => setActiveTab("assigned")} style={[styles.tab, activeTab === "assigned" && styles.activeTab]}>
              <Text style={styles.tabText}>Assigned</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab("unassigned")} style={[styles.tab, activeTab === "unassigned" && styles.activeTab]}>
              <Text style={styles.tabText}>Unassigned</Text>
            </TouchableOpacity>
          </View>

          {/* Device List */}
          <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
            {activeTab === "assigned" && (
              assignedDevices.length > 0 ? assignedDevices.map((device, idx) => (
                <DeviceCard key={idx} device={device} assigned />
              )) : <Text style={styles.emptyMessage}>No assigned devices</Text>
            )}

            {activeTab === "unassigned" && (
              unassignedDevices.length > 0 ? unassignedDevices.map((device, idx) => (
                <DeviceCard key={idx} device={device} />
              )) : <Text style={styles.emptyMessage}>No unassigned devices</Text>
            )}
          </ScrollView>

          {/* FAB */}
          <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
            <Ionicons name="add" size={30} color="white" />
          </TouchableOpacity>

          {/* Add Hub Modal */}
          <Modal visible={modalVisible} transparent animationType="slide">
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
                  {editMode ? "Edit Hub" : "Add New Hub"}
                </Text>

                <TextInput placeholder="Hub ID" style={styles.input} value={hubIdInput} editable={!editMode} onChangeText={setHubIdInput} />
                <TextInput placeholder="Name" style={styles.input} value={hubName} onChangeText={setHubName} />
                <TextInput placeholder="SSID" style={styles.input} value={hubSsid} onChangeText={setHubSsid} />
                <TextInput placeholder="Password" style={styles.input} value={hubPassword} secureTextEntry onChangeText={setHubPassword} />

                <TouchableOpacity style={styles.modalButton} onPress={editMode ? updateHub : submitNewHub}>
                  <Text style={{ color: "white" }}>{editMode ? "Update Hub" : "Save"}</Text>
                </TouchableOpacity>

                {editMode && (
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: "#e53e3e", marginTop: 10 }]}
                    onPress={deleteHub}
                  >
                    <Text style={{ color: "white" }}>Delete Hub</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.cancelButton} onPress={() => {
                  setModalVisible(false);
                  setEditMode(false);
                }}>
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
  container: { flex: 1, padding: 16, backgroundColor: "#f5f7fb" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 16, color: "#2d3748" },

  // 🔘 Hub Selector
  hubScroll: { marginBottom: 16, flexDirection: "row" },
  hubChip: {
    backgroundColor: "#a0aec0",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
  },
  activeHubChip: {
    backgroundColor: "#4299e1",
  },

  // 📋 Hub Info
  infoPanel: {
    backgroundColor: "#edf2f7",
    padding: 14,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 1,
  },
  infoText: {
    fontSize: 15,
    color: "#2d3748",
    marginBottom: 6,
  },

  // 🔁 Tab Styling
  tabHeader: {
    flexDirection: "row",
    backgroundColor: "#e2e8f0",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#4299e1",
  },
  tabText: {
    fontWeight: "600",
    color: "white",
  },

  // 📦 Device Cards
  deviceCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 1,
  },
  deviceText: {
    fontSize: 16,
    color: "#2d3748",
  },
  assignButton: {
    backgroundColor: "#4299e1",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },

  // ➕ FAB
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#4299e1",
    borderRadius: 30,
    padding: 16,
    elevation: 3,
  },

  // 🧾 Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    margin: 20,
    padding: 20,
    borderRadius: 10,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    marginBottom: 12,
    paddingVertical: 6,
  },
  modalButton: {
    backgroundColor: "#4299e1",
    padding: 10,
    alignItems: "center",
    borderRadius: 8,
    marginTop: 12,
  },
  cancelButton: {
    marginTop: 10,
    alignItems: "center",
  },

  emptyMessage: {
    textAlign: "center",
    color: "#999",
    padding: 20,
  },
  infoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2d3748",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 6,
    alignSelf: "center"
  },
  
  
});

