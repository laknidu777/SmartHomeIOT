import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function DevicePage({ navigation }) {
  const [devices, setDevices] = useState([]);
  const [deviceName, setDeviceName] = useState("");
  const [espId, setEspId] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const fetchDevices = async () => {
    try {
      const homeId = await AsyncStorage.getItem("homeId");
      const token = await AsyncStorage.getItem("idToken");

      const response = await fetch(
        `http://192.168.8.141:5000/api/items/?homeId=${homeId}`,
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>All Devices</Text>

      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Device Name"
          value={deviceName}
          onChangeText={setDeviceName}
          style={styles.input}
        />
        <TextInput
          placeholder="ESP ID (e.g. Light1)"
          value={espId}
          onChangeText={setEspId}
          style={styles.input}
        />
        <TextInput
          placeholder="Category ID"
          value={categoryId}
          onChangeText={setCategoryId}
          style={styles.input}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddDevice}>
          <Text style={styles.addButtonText}>Add Device</Text>
        </TouchableOpacity>
      </View>

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    height: 45,
    borderColor: "#ccc",
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: "#1c1c1c",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
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
});
