import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HeaderBar({ onMenuPress }) {
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
        AHG
      </Text>

      {/* Removed user icon */}
    </View>
  );
}
