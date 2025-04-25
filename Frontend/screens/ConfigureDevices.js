import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";

export default function ConfigureDevice({ route, navigation }) {
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [espId, setEspId] = useState(route.params?.espId || "");

  const handleConfigure = () => {
    // We’ll implement this in next step
    Alert.alert("Config Button Pressed", `ESP ID: ${espId}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Configure Your Device</Text>

      <TextInput
        placeholder="Wi-Fi SSID"
        style={styles.input}
        value={ssid}
        onChangeText={setSsid}
      />
      <TextInput
        placeholder="Wi-Fi Password"
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        placeholder="Device ID (espId)"
        style={styles.input}
        value={espId}
        onChangeText={setEspId}
      />

      <TouchableOpacity style={styles.button} onPress={handleConfigure}>
        <Text style={styles.buttonText}>Send Configuration</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
  },
  input: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#1c1c1c",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
