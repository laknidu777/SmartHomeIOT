// components/HeaderBar.js
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HeaderBar({ onMenuPress, userInitial = 'A' }) {
  return (
    <View style={{
      height: 56,
      backgroundColor: '#06b6d4',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      elevation: 4,
    }}>
      <TouchableOpacity onPress={onMenuPress}>
        <Ionicons name="menu" size={24} color="white" />
      </TouchableOpacity>

      <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>
        Smart Home
      </Text>

      <View style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Text style={{ fontWeight: 'bold', color: '#00A6FF' }}>{userInitial}</Text>
      </View>
    </View>
  );
}
