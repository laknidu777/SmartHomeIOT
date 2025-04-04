import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Button,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import { getDatabase, ref, set, get, update } from "firebase/database";

export default function AddItem() {
  const [selectedItem, setSelectedItem] = useState("Light");
  const [loading, setLoading] = useState(false);

  const handleAddItem = () => {
    setLoading(true);
    const db = getDatabase();
    const deviceRef = ref(db, "device");
    get(deviceRef)
      .then((snapshot) => {
        const data = snapshot.val() || {};
        const itemCount = Object.keys(data).filter((key) =>
          key.startsWith(selectedItem)
        ).length;
        const newItemId = `${selectedItem}${itemCount + 1}`; // Removed space
        const updates = {};
        updates[`device/${newItemId}`] = 0;
        updates[`Choose/${newItemId}`] = 0;
        update(ref(db), updates)
          .then(() => {
            setLoading(false);
            Alert.alert("Success", `New item added: ${newItemId}`);
          })
          .catch((error) => {
            setLoading(false);
            Alert.alert("Error adding new item to database:", error);
          });
      })
      .catch((error) => {
        setLoading(false);
        Alert.alert("Error fetching device data:", error);
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add New Item</Text>
      <Text style={styles.subtitle}>Let's manage your smart home</Text>
      <Picker
        selectedValue={selectedItem}
        style={styles.input}
        onValueChange={(itemValue) => setSelectedItem(itemValue)}
      >
        <Picker.Item label="Light" value="Light" />
        <Picker.Item label="Door" value="Door" />
        <Picker.Item label="Fan" value="Fan" />
      </Picker>
      {loading ? (
        <ActivityIndicator size="large" color="#1c1c1c" />
      ) : (
        <Button
          style={styles.button}
          title="Add Item"
          onPress={handleAddItem}
          disabled={loading}
          color="#1c1c1c"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#888",
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
});
