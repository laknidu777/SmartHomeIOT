import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  BackHandler,
  TextInput,
  Alert,
  ScrollView,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../utils/api";
import socket from "../utils/socket";

export default function SelectHome() {
  const navigation = useNavigation();
  const [homes, setHomes] = useState([]);
  const [newHomeName, setNewHomeName] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => true;
      BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () =>
        BackHandler.removeEventListener("hardwareBackPress", onBackPress);
    }, [])
  );

  useEffect(() => {
    const fetchHomes = async () => {
      setIsLoading(true);
      try {
        const token = await AsyncStorage.getItem("token");
        const res = await api.get("/api/homes", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 200) {
          setHomes(res.data.homes || []);
        } else {
          console.error("❌ Error loading homes:", res.data.error);
        }
      } catch (error) {
        console.error("❌ Error fetching homes:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHomes();
  }, []);

  const handleAddHome = async () => {
    if (!newHomeName.trim()) return Alert.alert("Enter a valid home name");

    try {
      const token = await AsyncStorage.getItem("token");
      const res = await api.post(
        "/api/homes",
        { name: newHomeName },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.status === 201) {
        const newHome = { id: res.data.homeId, name: newHomeName };
        setHomes([...homes, newHome]);
        setNewHomeName("");
        setModalVisible(false);
      } else {
        Alert.alert("Error", res.data?.error || "Something went wrong");
      }
    } catch (error) {
      console.error("❌ Error adding home:", error);
      Alert.alert("Failed to add home");
    }
  };

  const handleHomeSelect = async (home) => {
    await AsyncStorage.setItem("homeId", String(home.id));
    await AsyncStorage.setItem("homeName", home.name);
    navigation.navigate("Home");
  };

  const openAddHomeModal = () => {
    setNewHomeName("");
    setModalVisible(true);
  };

  const LoadingAnimation = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#4299e1" />
      <Text style={styles.loadingText}>Loading your homes...</Text>
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      <ScrollView style={styles.scrollContent}>
        <View style={styles.container}>
          <View style={styles.welcomeSection}>
            <View>
              <Text style={styles.title}>Select your Home</Text>
              <Text style={styles.subtitle}>
                Choose or create a new smart home
              </Text>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Available Homes</Text>
              <Text style={styles.statValue}>
                {isLoading ? "-" : homes.length}
              </Text>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Homes</Text>
          </View>

          {isLoading ? (
            <LoadingAnimation />
          ) : (
            <View style={styles.homesGrid}>
              {homes.map((home) => (
                <TouchableOpacity
                  key={home.id}
                  style={styles.homeCard}
                  onPress={() => handleHomeSelect(home)}
                >
                  <Ionicons
                    name="home"
                    size={32}
                    color="#4299e1"
                    style={styles.homeIcon}
                  />
                  <Text style={styles.homeName}>{home.name}</Text>
                  <View style={styles.selectionIndicator}>
                    <Text style={styles.selectText}>Select</Text>
                  </View>
                </TouchableOpacity>
              ))}
              {homes.length === 0 && (
                <View style={styles.noHomesContainer}>
                  <Ionicons name="home-outline" size={48} color="#a0aec0" />
                  <Text style={styles.noHomesText}>No homes found</Text>
                  <Text style={styles.noHomesSubtext}>
                    Tap "+" to create your first home
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {!isLoading && (
        <TouchableOpacity style={styles.fab} onPress={openAddHomeModal}>
          <Ionicons name="add" size={28} color="white" />
        </TouchableOpacity>
      )}

      {/* Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Home</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#718096" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Home Name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter home name"
              value={newHomeName}
              onChangeText={setNewHomeName}
              placeholderTextColor="#a0aec0"
            />

            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleAddHome}
              >
                <Text style={styles.modalSaveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ✅ Your original styles remain untouched from your provided code
// Paste your full `styles` object here (it already works fine)

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#f5f7fb",
  },
  scrollContent: {
    flex: 1,
  },
  container: {
    padding: 16,
  },
  welcomeSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 60,
    marginBottom: 24,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2d3748",
  },
  subtitle: {
    fontSize: 14,
    color: "#718096",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    alignItems: "center",
  },
  statCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    elevation: 3,
    width: "100%",
  },
  statLabel: {
    fontSize: 14,
    color: "#718096",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2d3748",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2d3748",
  },
  homesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  homeCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    width: "48%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    elevation: 3,
  },
  homeIcon: {
    marginBottom: 12,
  },
  homeName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d3748",
    textAlign: "center",
    marginBottom: 8,
  },
  selectionIndicator: {
    backgroundColor: "#ebf8ff",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  selectText: {
    color: "#4299e1",
    fontSize: 12,
    fontWeight: "500",
  },
  noHomesContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    backgroundColor: "white",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    elevation: 3,
  },
  noHomesText: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "600",
    color: "#2d3748",
  },
  noHomesSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#718096",
    textAlign: "center",
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    width: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2d3748",
  },
  modalLabel: {
    fontSize: 14,
    color: "#718096",
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: "#f7fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#2d3748",
    marginBottom: 24,
  },
  modalButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalCancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    width: "48%",
    alignItems: "center",
    backgroundColor: "#f7fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  modalCancelButtonText: {
    color: "#718096",
    fontWeight: "600",
  },
  modalSaveButton: {
    backgroundColor: "#06b6d4",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    width: "48%",
    alignItems: "center",
  },
  modalSaveButtonText: {
    color: "white",
    fontWeight: "600",
  },
});
