import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig"; // Make sure you export both

export default function Signup() {
  const navigation = useNavigation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async () => {
    console.log("📥 Signup button pressed");
  
    if (!name || !email || !password) {
      Alert.alert("Error", "All fields are required");
      console.warn("⚠️ Missing fields:", { name, email, password });
      return;
    }
  
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      console.warn("⚠️ Password too short:", password);
      return;
    }
  
    try {
      console.log("🔐 Creating user with email:", email);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("✅ User created:", user.uid);
  
      console.log("📦 Writing user to Firestore...");
      await setDoc(doc(db, "users", user.uid), {
        name: name,
        email: email,
      });
      console.log("✅ User document saved to Firestore");
  
      Alert.alert("Success", "Signup complete");
      navigation.navigate("Login");
    } catch (error) {
      console.error("❌ Signup error:", error);
      Alert.alert("Signup Failed", error.message);
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TouchableOpacity style={styles.button} onPress={handleSignup}>
        <Text style={styles.buttonText}>Signup</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.linkText}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 40,
  },
  input: {
    width: 300,
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  button: {
    width: 300,
    height: 40,
    backgroundColor: "#1c1c1c",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  linkText: {
    color: "#1c1c1c",
    marginTop: 20,
  },
});
