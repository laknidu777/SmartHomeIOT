import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

export default function FirebaseTest() {
  const [message, setMessage] = useState("Checking Firebase...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testConnection = async () => {
      try {
        const docRef = doc(db, "test", "connection");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setMessage(`✅ Connected! Status: ${data.status}`);
        } else {
          setMessage("⚠️ Document not found.");
        }
      } catch (error) {
        setMessage("❌ Firebase error: " + error.message);
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    testConnection();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Firebase Test</Text>
      {loading ? <ActivityIndicator size="large" /> : <Text>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  text: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
});
