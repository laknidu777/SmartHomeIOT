import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Linking,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function SupportPage() {
  const handleEmail = () => {
    Linking.openURL("mailto:support@homegenie.com?subject=Support Request");
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Support & Help Center</Text>

        <View style={styles.section}>
          <Ionicons name="help-circle-outline" size={26} color="#4299e1" />
          <Text style={styles.sectionTitle}>How can we help?</Text>
          <Text style={styles.sectionText}>
            This app allows you to control and monitor smart home devices in real time. If you run into any issues, feel free to reach out or check the resources below.
          </Text>
        </View>

        <View style={styles.section}>
          <Ionicons name="mail-outline" size={24} color="#4299e1" />
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <Text style={styles.sectionText}>
            Email us at{" "}
            <Text style={styles.linkText} onPress={handleEmail}>
              support@homegenie.com
            </Text>{" "}
            for any inquiries.
          </Text>
        </View>

        <View style={styles.section}>
          <Ionicons name="information-circle-outline" size={24} color="#4299e1" />
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          <Text style={styles.sectionText}>
            • How do I add a device? {"\n"}
            Tap the ➕ button on the Devices page to add a new smart device. {"\n\n"}
            • Why is my device offline? {"\n"}
            Make sure your device/s is powered and connected to Wi-Fi. {"\n\n"}
            • How do I delete a room? {"\n"}
            Tap and hold a room to see delete options.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fb" },
  content: { padding: 20 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#2d3748",
    textAlign: "center",
  },
  section: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 10,
    color: "#2d3748",
  },
  sectionText: {
    marginTop: 6,
    fontSize: 14,
    color: "#4a5568",
  },
  linkText: {
    color: "#3182ce",
    textDecorationLine: "underline",
  },
});
