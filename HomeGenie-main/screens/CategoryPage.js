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

export default function CategoryPage({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [categoryName, setCategoryName] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const homeId = await AsyncStorage.getItem("homeId");
      const token = await AsyncStorage.getItem("idToken");

      const response = await fetch(
        `http://192.168.8.141:5000/api/categories?homeId=${homeId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.categories) {
        setCategories(data.categories);
      } else {
        console.warn("No categories returned");
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!categoryName.trim()) {
      Alert.alert("Please enter a category name");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("idToken");
      const homeId = await AsyncStorage.getItem("homeId");

      const response = await fetch("http://192.168.8.141:5000/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          homeId,
          name: categoryName,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("✅ Category added");
        setCategoryName("");
        setModalVisible(false);
        fetchCategories(); // Refresh list
      } else {
        console.error("Failed to add category:", data);
        Alert.alert("❌ Failed to add category");
      }
    } catch (err) {
      console.error("Error adding category:", err);
      Alert.alert("Error adding category");
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const LoadingAnimation = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#06b6d4" />
      <Text style={styles.loadingText}>Loading categories...</Text>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Categories</Text>

        {isLoading ? (
          <LoadingAnimation />
        ) : (
          <View style={styles.grid}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={styles.tile}
                onPress={() =>
                  navigation.navigate("Home", {
                    categoryId: cat.id,
                    categoryName: cat.name,
                  })
                }
              >
                <Text style={styles.tileText}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>

      {/* Modal for Add Category */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Category</Text>
            <TextInput
              placeholder="Enter category name"
              value={categoryName}
              onChangeText={setCategoryName}
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
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleAddCategory}
              >
                <Text style={{ color: "white" }}>Add</Text>
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
    borderColor: "#ccc",
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
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
    backgroundColor: "#06b6d4", // cyan
    padding: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
  },
});
