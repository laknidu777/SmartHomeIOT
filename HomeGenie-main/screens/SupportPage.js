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

        {/* How can we help */}
        <View style={styles.section}>
          <Ionicons name="help-circle-outline" size={26} color="#4299e1" />
          <Text style={styles.sectionTitle}>How can we help?</Text>
          <Text style={styles.sectionText}>
            This app allows you to control and monitor smart home devices in real time. If you run into any issues, feel free to reach out or check the resources below.
          </Text>
        </View>

        {/* Contact us */}
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

        {/* FAQ */}
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

        {/* Getting Started */}
        <View style={styles.section}>
          <Ionicons name="rocket-outline" size={24} color="#4299e1" />
          <Text style={styles.sectionTitle}>Getting Started: Add Your First Device</Text>

          <Text style={styles.stepTitle}>Step 1: Power On</Text>
          <Text style={styles.sectionText}>
            🔌 Turn on your smart device. Its LED will blink to indicate setup mode.
          </Text>

          <Text style={styles.stepTitle}>Step 2: Connect to Setup Wi-Fi</Text>
          <Text style={styles.sectionText}>
            📱 On your phone, go to Wi-Fi settings and connect to <Text style={styles.bold}>Device_Setup</Text>.
          </Text>

          <Text style={styles.stepTitle}>Step 3: Enter Wi-Fi Details</Text>
          <Text style={styles.sectionText}>
            🌐 A portal will appear. Enter your home Wi-Fi name & password. Tap <Text style={styles.bold}>Save</Text>.
          </Text>

          <Text style={styles.stepTitle}>Step 4: Login to the App</Text>
          <Text style={styles.sectionText}>
            🔓 Open the app and sign in or sign up to your HomeGenie account.
          </Text>

          <Text style={styles.stepTitle}>Step 5: Add a Home</Text>
          <Text style={styles.sectionText}>
            🏠 Go to the <Text style={styles.bold}>Homes</Text> tab → Tap ➕ Add Home → Enter home name & address.
          </Text>

          <Text style={styles.stepTitle}>Step 6: Add a Room</Text>
          <Text style={styles.sectionText}>
            🚪 Tap ➕ Add Room inside your home → Name it (e.g., Kitchen, Bedroom).
          </Text>

          <Text style={styles.stepTitle}>Step 7: Add a Device</Text>
          <Text style={styles.sectionText}>
            💡 Tap ➕ Add Device → Enter device ID (printed on device) → Give it a custom name.
          </Text>

          <Text style={styles.stepTitle}>Step 8: Control It</Text>
          <Text style={styles.sectionText}>
            🔘 Use the toggle to turn it ON/OFF. Doorlocks may prompt you for a PIN.
          </Text>

          <Text style={styles.stepTitle}>Step 9: Enjoy & Share Feedback</Text>
          <Text style={styles.sectionText}>
            🎉 You're ready! Email{" "}
            <Text style={styles.linkText} onPress={handleEmail}>
              support@homegenie.com
            </Text>{" "}
            with suggestions or issues.
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
    marginBottom: 10,
    color: "#2d3748",
  },
  stepTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
    color: "#2d3748",
  },
  sectionText: {
    marginTop: 4,
    fontSize: 14,
    color: "#4a5568",
    lineHeight: 20,
  },
  bold: {
    fontWeight: "600",
    color: "#2d3748",
  },
  linkText: {
    color: "#3182ce",
    textDecorationLine: "underline",
  },
});
