import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { auth, db } from "../firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  query,
} from "firebase/firestore";

export default function AddCategory({ route, navigation }) {
  const { homeId } = route.params;
  const [categoryName, setCategoryName] = useState("");
  const [categories, setCategories] = useState([]);

  const fetchCategories = async () => {
    try {
      const user = auth.currentUser;
      const categoriesRef = collection(
        db,
        "users",
        user.uid,
        "homes",
        homeId,
        "categories"
      );
      const snapshot = await getDocs(query(categoriesRef));
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCategories(list);
    } catch (error) {
      console.error("❌ Error loading categories:", error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = async () => {
    if (!categoryName.trim()) {
      Alert.alert("Please enter a category name.");
      return;
    }

    try {
      const user = auth.currentUser;
      const categoriesRef = collection(
        db,
        "users",
        user.uid,
        "homes",
        homeId,
        "categories"
      );
      const docRef = await addDoc(categoriesRef, {
        name: categoryName.trim(),
        createdAt: new Date(),
      });

      setCategories([...categories, { id: docRef.id, name: categoryName }]);
      setCategoryName("");
    } catch (error) {
      console.error("❌ Error adding category:", error);
      Alert.alert("Failed to add category");
    }
  };

  const handleCategorySelect = (category) => {
    // You can navigate to item list or item adder here
    console.log("Selected category:", category);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Add Category</Text>

      {categories.map((cat) => (
        <TouchableOpacity
          key={cat.id}
          style={styles.categoryButton}
          onPress={() => handleCategorySelect(cat)}
        >
          <Text style={styles.categoryText}>{cat.name}</Text>
        </TouchableOpacity>
      ))}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Category name"
          value={categoryName}
          onChangeText={setCategoryName}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddCategory}>
          <Text style={styles.addButtonText}>Add Category</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 80,
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  inputContainer: {
    marginTop: 30,
    width: "100%",
    alignItems: "center",
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: "#1c1c1c",
    padding: 14,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  categoryButton: {
    width: "100%",
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 12,
    elevation: 2,
    alignItems: "center",
  },
  categoryText: {
    fontSize: 18,
  },
});
