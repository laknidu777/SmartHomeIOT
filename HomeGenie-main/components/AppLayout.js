// AppLayout.js
import React from "react";
import { View, StyleSheet } from "react-native";
import HeaderBar from "./HeaderBar";
import FooterBar from "./FooterBar";
import { useNavigation } from "@react-navigation/native";



export default function AppLayout({ children }) {
  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      <HeaderBar />
      <View style={styles.content}>
        {children}
      </View>
      <FooterBar navigation={navigation} />
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
