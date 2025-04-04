import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function User() {
  const navigation = useNavigation();

  const handleLogout = async () => {
    navigation.navigate("Login");
    await AsyncStorage.clear();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Tester</Text>
      <View style={styles.infoWrapper}>
        <View style={styles.infoContainer}>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>Tester</Text>
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>test@test.com</Text>
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.label}>Password</Text>
          <Text style={styles.value}>********</Text>
        </View>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleLogout}>
          <Text style={{ color: "#fff" }}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 50,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 20,
  },
  infoWrapper: {
    marginTop: 200,
  },
  infoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  label: {
    fontSize: 18,
    fontWeight: "bold",
  },
  value: {
    fontSize: 18,
    color: "#555",
  },
  buttonContainer: {
    marginTop: 70,
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
