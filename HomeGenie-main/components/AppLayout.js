// AppLayout.js
import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import HeaderBar from "./HeaderBar";
import FooterBar from "./FooterBar";
import Sidebar from "./Sidebar";
import { useNavigation } from "@react-navigation/native";

export default function AppLayout({ children }) {
  const navigation = useNavigation();
  const [isSidebarVisible, setSidebarVisible] = useState(false);

  const toggleSidebar = () => {
    setSidebarVisible(!isSidebarVisible);
  };

  return (
    <View style={styles.container}>
      <HeaderBar onMenuPress={toggleSidebar} userInitial="A" />
      <View style={styles.content}>
        {children}
      </View>
      <FooterBar navigation={navigation} />
      <Sidebar visible={isSidebarVisible} onClose={() => setSidebarVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
    padding: 10,
  },
});
