import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function StatusRow() {
  return (
    <View style={styles.container}>
      <View style={styles.item}>
        <Text style={styles.emoji}>🔥</Text>
        <Text style={[styles.label, { color: '#ff5050' }]}>25°C</Text>
      </View>
      <View style={styles.item}>
        <Text style={styles.emoji}>💧</Text>
        <Text style={[styles.label, { color: '#4299e1' }]}>55%</Text>
      </View>
      <View style={styles.item}>
        <Text style={styles.emoji}>🚗</Text>
        <Text style={styles.label}>Home</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  item: {
    alignItems: 'center',
  },
  emoji: {
    fontSize: 18,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    color: '#666',
  },
});
