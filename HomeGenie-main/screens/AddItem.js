import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  SafeAreaView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { db, auth } from "../firebaseConfig";
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

export default function AddItem({ route, navigation }) {
  const { homeId } = route.params || {};
  const user = auth.currentUser;
  const [name, setName] = useState("");
  const [espId, setEspId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const catRef = collection(db, "users", user.uid, "homes", homeId, "categories");
        const snapshot = await getDocs(catRef);
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCategories(list);
        if (list.length > 0) setCategoryId(list[0].id); // default selection
      } catch (err) {
        console.error("❌ Failed to load categories:", err);
      }
    };

    fetchCategories();
  }, []);

  const handleAddItem = async () => {
    if (!name.trim() || !categoryId) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      const itemRef = collection(db, "users", user.uid, "homes", homeId, "items");
      await addDoc(itemRef, {
        name: name.trim(),
        espId: espId.trim(),
        categoryId,
        status: false,
        createdAt: serverTimestamp(),
      });

      Alert.alert("Success", "Item added successfully");
      setName("");
      setEspId("");
      navigation.goBack();
    } catch (error) {
      console.error("❌ Failed to add item:", error);
      Alert.alert("Failed to add item");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Add New Item</Text>

        <TextInput
          style={styles.input}
          placeholder="Item Name"
          value={name}
          onChangeText={setName}
        />

        <TextInput
          style={styles.input}
          placeholder="ESP ID (optional)"
          value={espId}
          onChangeText={setEspId}
        />

        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={categoryId}
            onValueChange={(value) => setCategoryId(value)}
            style={styles.picker}
          >
            {categories.map((cat) => (
              <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
            ))}
          </Picker>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
          <Text style={styles.addButtonText}>Add Item</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f2f2f2",
  },
  container: {
    paddingTop: 60,
    paddingHorizontal: 20,
    alignItems: "center",
    paddingBottom: 80,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
  },
  input: {
    width: "100%",
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  pickerContainer: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 20,
  },
  picker: {
    width: "100%",
    height: 50,
  },
  addButton: {
    width: "100%",
    padding: 15,
    backgroundColor: "#1c1c1c",
    borderRadius: 8,
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
