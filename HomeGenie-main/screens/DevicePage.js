import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function DevicePage({ navigation }) {
  const [devices, setDevices] = useState([]);
  const [deviceName, setDeviceName] = useState("");
  const [espId, setEspId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchDevices = async () => {
    setIsLoading(true);
    try {
      const homeId = await AsyncStorage.getItem("homeId");
      const token = await AsyncStorage.getItem("idToken");

      const response = await fetch(
        `http://192.168.8.141:5000/api/items/all/?homeId=${homeId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.items) {
        setDevices(data.items);
      } else {
        console.warn("No devices returned");
      }
    } catch (err) {
      console.error("Error fetching all devices:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDevice = async () => {
    if (!deviceName.trim() || !espId.trim() || !categoryId.trim()) {
      Alert.alert("All fields are required (Name, ESP ID, Category ID)");
      return;
    }
    try {
      const token = await AsyncStorage.getItem("idToken");
      const homeId = await AsyncStorage.getItem("homeId");

      const response = await fetch("http://192.168.8.141:5000/api/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          homeId,
          categoryId,
          name: deviceName,
          espId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("✅ Device added");
        setDeviceName("");
        setEspId("");
        setCategoryId("");
        setModalVisible(false);
        fetchDevices(); // Refresh
      } else {
        console.error("Failed to add device:", data);
        Alert.alert("❌ Failed to add device");
      }
    } catch (err) {
      console.error("Error adding device:", err);
      Alert.alert("Error adding device");
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const LoadingAnimation = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#4299e1" />
      <Text style={styles.loadingText}>Loading devices...</Text>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        {isLoading ? (
          <LoadingAnimation />
        ) : (
          <>
            <Text style={styles.title}>All Devices</Text>
            <View style={styles.grid}>
              {devices.map((device) => (
                <View key={device.id} style={styles.tile}>
                  <Text style={styles.tileText}>{device.name}</Text>
                  <Text style={styles.espText}>ESP ID: {device.espId}</Text>
                  <Text style={styles.status}>
                    {device.status ? "🟢 Online" : "🔴 Offline"}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>

      {/* Add Device Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Add New Device</Text>

            <TextInput
              placeholder="Device Name"
              value={deviceName}
              onChangeText={setDeviceName}
              style={styles.input}
              placeholderTextColor="#a0aec0"
            />
            <TextInput
              placeholder="ESP ID"
              value={espId}
              onChangeText={setEspId}
              style={styles.input}
              placeholderTextColor="#a0aec0"
            />
            <TextInput
              placeholder="Category ID"
              value={categoryId}
              onChangeText={setCategoryId}
              style={styles.input}
              placeholderTextColor="#a0aec0"
            />

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleAddDevice}
              >
                <Text style={styles.modalSaveText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    marginBottom: 15,
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  tile: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 20,
    marginBottom: 15,
    alignItems: "center",
    elevation: 3,
  },
  tileText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
  },
  espText: {
    fontSize: 12,
    color: "#555",
    marginBottom: 5,
  },
  status: {
    fontSize: 14,
    color: "#666",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
    paddingBottom: 100,
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
    backgroundColor: "#06b6d4", // cyan
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  
  fabText: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
    marginTop: -1,
  },  
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "white",
    width: "85%",
    padding: 20,
    borderRadius: 12,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#2d3748",
    textAlign: "center",
  },
  input: {
    height: 45,
    borderColor: "#ccc",
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#fff",
    marginBottom: 10,
    color: "#2d3748",
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  modalCancelButton: {
    backgroundColor: "#e2e8f0",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: "48%",
    alignItems: "center",
  },
  modalCancelText: {
    color: "#2d3748",
    fontWeight: "600",
  },
  modalSaveButton: {
    backgroundColor: "#06b6d4",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: "48%",
    alignItems: "center",
  },
  modalSaveText: {
    color: "#fff",
    fontWeight: "600",
  },
});
