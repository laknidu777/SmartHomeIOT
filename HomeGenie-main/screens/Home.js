import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Button,
} from "react-native";
import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  getDatabase,
  ref,
  get,
  update,
  onValue,
  remove,
} from "firebase/database";
import { database } from "../firebaseConfig"; // Import the database

export default function Home() {
  const [devices, setDevices] = useState([]);
  const [emgStatus, setEmgStatus] = useState(false);
  const [loading, setLoading] = useState(true); // Add loading state
  const [modalVisible, setModalVisible] = useState(false);
  const [chooseData, setChooseData] = useState({});
  const navigation = useNavigation();
  const route = useRoute();
  const prevNewItemRef = useRef();
  const [pendingNewItem, setPendingNewItem] = useState(null);

  useEffect(() => {
    const prevNewItem = prevNewItemRef.current;
    if (route.params?.newItem && route.params?.newItem !== prevNewItem) {
      setPendingNewItem(route.params.newItem);
      prevNewItemRef.current = route.params?.newItem;
    }
  }, [route.params?.newItem]);

  useEffect(() => {
    if (pendingNewItem) {
      const newDevice = { type: pendingNewItem.type, isOn: false };
      setDevices((prevDevices) => [...prevDevices, newDevice]);
      setPendingNewItem(null);
    }
  }, [pendingNewItem]);

  useEffect(() => {
    const deviceRef = ref(database, "device");
    const unsubscribe = onValue(
      deviceRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const deviceArray = Object.keys(data).map((key) => ({
            type: key,
            isOn: data[key] === 1,
          }));
          setDevices(deviceArray);
        } else {
          console.log("No data available for devices");
        }
        setLoading(false); // Set loading to false after data is fetched
      },
      (error) => {
        console.error("Error fetching device data:", error);
        setLoading(false); // Set loading to false in case of error
      }
    );

    return () => unsubscribe();
  }, [route.params?.refresh]);

  useEffect(() => {
    const emgRef = ref(database, "emgSensorData/value");
    const unsubscribe = onValue(
      emgRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setEmgStatus(snapshot.val() === 1);
        } else {
          console.log("No data available for EMG sensor");
        }
      },
      (error) => {
        console.error("Error fetching EMG sensor data:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (modalVisible) {
      const chooseRef = ref(database, "Choose");
      get(chooseRef)
        .then((snapshot) => {
          if (snapshot.exists()) {
            setChooseData(snapshot.val());
          } else {
            console.log("No data available for Choose");
          }
        })
        .catch((error) => {
          console.error("Error fetching Choose data:", error);
        });
    }
  }, [modalVisible]);

  const toggleDevice = (index) => {
    setDevices((prevDevices) => {
      const updatedDevices = prevDevices.map((device, i) =>
        i === index ? { ...device, isOn: !device.isOn } : device
      );

      const updatedDevice = updatedDevices[index];
      const deviceRef = ref(database, `device/`);
      update(deviceRef, { [updatedDevice.type]: updatedDevice.isOn ? 1 : 0 });

      return updatedDevices;
    });
  };

  const confirmDeleteDevice = (index) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this device?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteDevice(index),
        },
      ],
      { cancelable: true }
    );
  };

  const deleteDevice = (index) => {
    setDevices((prevDevices) => {
      const updatedDevices = prevDevices.filter((_, i) => i !== index);
      const deviceToDelete = prevDevices[index];

      const db = getDatabase();
      const deviceRef = ref(db, `device/${deviceToDelete.type}`);
      const chooseRef = ref(db, `Choose/${deviceToDelete.type}`); // Also delete from Choose

      remove(deviceRef).catch((error) => {
        Alert.alert("Error removing device from database:", error);
      });

      remove(chooseRef).catch((error) => {
        Alert.alert("Error removing device from Choose collection:", error);
      });

      return updatedDevices;
    });
  };

  const toggleChooseItem = (key) => {
    setChooseData((prevData) => ({
      ...prevData,
      [key]: prevData[key] === 1 ? 0 : 1,
    }));
  };

  const handleSubmit = () => {
    const chooseRef = ref(database, "Choose");
    update(chooseRef, chooseData)
      .then(() => {
        const statusRef = ref(database, "Status");
        update(statusRef, { Status: 1 }) // Add this line to update the Status field
          .then(() => {
            Alert.alert(
              "Success",
              "Choose data and Status updated successfully"
            );
          })
          .catch((error) => {
            Alert.alert("Error updating Status:", error);
          });
        setModalVisible(false);
      })
      .catch((error) => {
        Alert.alert("Error updating Choose data:", error);
      });
  };

  const getIcon = (type) => {
    if (type.startsWith("Light")) {
      return <Ionicons name="bulb-outline" style={styles.icon} />;
    } else if (type.startsWith("Fan")) {
      return (
        <MaterialCommunityIcons
          name="ceiling-fan-light"
          size={70}
          color="#2b2b2b"
        />
      );
    } else if (type.startsWith("Door")) {
      return <MaterialCommunityIcons name="door-sliding" style={styles.icon} />;
    } else {
      return <Ionicons name="bulb-outline" style={styles.icon} />;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome</Text>
      <Text style={styles.subtitle}>Let's manage your smart home</Text>
      <TouchableOpacity
        style={styles.addIconContainer}
        onPress={() => navigation.navigate("AddItem")}
      >
        <Ionicons
          name="add-circle-outline"
          size={24}
          color="black"
          style={styles.addIcon}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.sensorContainer}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="pulse-outline" size={24} color="#a2a2a2" />
        <Text style={styles.sensorText}>EGM Sensor Status</Text>
        <Text style={styles.sensorStatus}>{emgStatus ? "ON" : "OFF"}</Text>
      </TouchableOpacity>
      {loading ? (
        <ActivityIndicator size="large" color="#1c1c1c" />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.deviceContainer}>
            {devices.map((device, index) => (
              <View key={index} style={styles.device}>
                <View style={styles.TopContainer}>
                  {getIcon(device.type)}

                  <TouchableOpacity onPress={() => confirmDeleteDevice(index)}>
                    <MaterialIcons name="delete" size={24} color="#a3a3a3" />
                  </TouchableOpacity>
                </View>
                <View style={styles.typeContainer}>
                  <Text style={styles.deviceText}>{device.type}</Text>
                  <Switch
                    value={device.isOn}
                    onValueChange={() => toggleDevice(index)}
                  />
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose Data</Text>
            <ScrollView>
              {Object.keys(chooseData).map((key) => (
                <View key={key} style={styles.chooseItem}>
                  <Text>{key}</Text>
                  <Switch
                    value={chooseData[key] === 1}
                    onValueChange={() => toggleChooseItem(key)}
                  />
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
              <Text style={{ color: "#fff" }}>Submit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={() => setModalVisible(false)}
            >
              <Text style={{ color: "#fff" }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 1,
  },
  subtitle: {
    fontSize: 16,
    color: "#888",
    marginBottom: 20,
  },
  addIconContainer: {
    position: "relative",
    top: -50,
  },
  addIcon: {
    position: "absolute",
    top: -5,
    right: 20,
  },
  sensorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    marginBottom: 20,
  },
  sensorText: {
    fontSize: 16,
  },
  sensorStatus: {
    fontSize: 16,
    fontWeight: "bold",
  },

  TopContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  deviceContainer: {
    flex: 2,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  device: {
    width: "48%",
    padding: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    alignItems: "left",
    marginBottom: 20,
    backgroundColor: "#f9f9f9",
    position: "relative",
  },

  scrollViewContent: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignContent: "center",
  },

  typeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },

  deviceText: {
    fontSize: 24,
    marginVertical: 10,
  },
  type: {
    fontSize: 24,
  },

  icon: {
    color: "#2b2b2b",
    fontSize: 70,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "80%",
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  chooseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  button: {
    marginTop: 20,
    backgroundColor: "#1c1c1c",
    color: "#fff",
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },
});
