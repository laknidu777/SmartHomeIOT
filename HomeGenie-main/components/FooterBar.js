// components/FooterBar.js
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function FooterBar() {
  return (
    <View style={styles.footer}>
      <TouchableOpacity style={styles.navItem}>
        <Ionicons name="home-outline" size={22} color="#4299e1" />
        <Text style={styles.label}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem}>
        <Ionicons name="cube-outline" size={22} color="#718096" />
        <Text style={styles.label}>Rooms</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem}>
        <Ionicons name="bulb-outline" size={22} color="#718096" />
        <Text style={styles.label}>Devices</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem}>
        <Ionicons name="settings-outline" size={22} color="#718096" />
        <Text style={styles.label}>Settings</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    height: 56,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    // position: 'absolute',
    // bottom: 0,
    // width: '100%',
    // zIndex: 10,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    color: '#718096',
    marginTop: 2,
  },
});
