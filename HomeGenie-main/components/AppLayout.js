// components/AppLayout.js
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import HeaderBar from './HeaderBar';
import FooterBar from './FooterBar';
import Sidebar from './Sidebar';

export default function AppLayout({ children }) {
  const [sidebarVisible, setSidebarVisible] = useState(false);

  return (
    <View style={styles.mainContainer}>
      <HeaderBar onMenuPress={() => setSidebarVisible(true)} userInitial="A" />
      <Sidebar visible={sidebarVisible} onClose={() => setSidebarVisible(false)} />

      <View style={styles.contentAndFooter}>
        <ScrollView 
          style={styles.contentContainer} 
          scrollEnabled={!sidebarVisible}
          contentContainerStyle={{ paddingBottom: 70 }} // Adjust padding if needed
        >
          {children}
        </ScrollView>
        <FooterBar />
      </View>

      <FooterBar />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },
  contentContainer: {
    flex: 1,
  },
});
