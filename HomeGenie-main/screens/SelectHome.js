import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  BackHandler,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

export default function SelectHome({ navigation }) {
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        // Prevent going back
        return true;
      };

      BackHandler.addEventListener("hardwareBackPress", onBackPress);

      return () => {
        BackHandler.removeEventListener("hardwareBackPress", onBackPress);
      };
    }, [])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select your Home</Text>
      <TouchableOpacity
        style={styles.homeButton}
        onPress={() => navigation.navigate("HomeTabs")} // Add navigation to Home page
      >
        <Text style={styles.homeText}>Home 1</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.addButton}>
        <Ionicons name="add-circle-outline" size={24} color="black" />
        <Text style={styles.addText}>Add Your Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    padding: 20,
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
  },
  homeButton: {
    width: "80%",
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
    elevation: 3,
  },
  homeText: {
    fontSize: 18,
    marginBottom: 10,
  },
  addButton: {
    width: "80%",
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    elevation: 3,
  },
  addText: {
    fontSize: 18,
    marginLeft: 10,
  },
});
