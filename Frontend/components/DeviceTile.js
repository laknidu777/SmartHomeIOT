import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function DeviceTile({ icon, title, value }) {
  return (
    <TouchableOpacity style={styles.tile}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {value && <Text style={styles.value}>{value}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: '47%',
    backgroundColor: '#fff',
    margin: '1.5%',
    padding: 12,
    borderRadius: 10,
    elevation: 2,
  },
  icon: {
    fontSize: 24,
    textAlign: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'center',
  },
  value: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
});
