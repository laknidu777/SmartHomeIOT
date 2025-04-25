import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Modal,
  Pressable,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

export default function Sidebar({ visible, onClose }) {
  const [darkMode, setDarkMode] = useState(false);
  const slideAnimation = new Animated.Value(0);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const navigation = useNavigation();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const name = await AsyncStorage.getItem('name');
        const email = await AsyncStorage.getItem('email');
        if (name) setUserName(name);
        if (email) setUserEmail(email);
      } catch (e) {
        console.error("❌ Failed to load user data:", e);
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleLogout = async () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      {
        text: "Cancel",
        style: "cancel"
      },
      {
        text: "Log Out",
        onPress: async () => {
          await AsyncStorage.clear();
          navigation.reset({
            index: 0,
            routes: [{ name: "Login" }],
          });
        },
        style: "destructive"
      }
    ]);
  };

  const sidebarTranslate = slideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 0]
  });

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.modalContainer}>
        <Pressable style={styles.overlay} onPress={onClose} />

        <Animated.View
          style={[
            styles.sidebar,
            { transform: [{ translateX: sidebarTranslate }] }
          ]}
        >
          {/* Header */}
          <View style={styles.sidebarHeader}>
            <View style={styles.userAvatar}>
              <Text style={styles.avatarText}>
                {userName ? userName.charAt(0).toUpperCase() : "U"}
              </Text>
            </View>
            <View>
              <Text style={styles.username}>{userName}</Text>
              <Text style={styles.email}>{userEmail}</Text>
            </View>
          </View>

          {/* Menu */}
          <ScrollView style={styles.sidebarMenu}>
            <MenuSection title="Main">
              <MenuItem title="Dashboard" icon="grid-outline" active />
              <MenuItem title="Rooms" icon="home-outline" />
              <MenuItem title="Devices" icon="bulb-outline" badge="3" 
                onPress={() => navigation.navigate("DevicePage")}>
              </MenuItem>
              <MenuItem title="Central Hub" icon="server-outline" 
              onPress={() => navigation.navigate("HubPage")} ></MenuItem> 
              <MenuItem title="Settings" icon="settings-outline" />
            </MenuSection>

            <MenuSection title="Automation">
              <MenuItem title="Schedules" icon="alarm-outline" />
              <MenuItem title="Scenes" icon="images-outline" />
              <MenuItem title="Routines" icon="sync-outline" />
            </MenuSection>

            <MenuSection title="Support">
              <MenuItem title="Help Center" icon="help-circle-outline"badge="3" 
                onPress={() => navigation.navigate("SupportPage")}>
              </MenuItem>
              <MenuItem title="Contact Us" icon="mail-outline" />
            </MenuSection>
          </ScrollView>

          {/* Footer */}
          <View style={styles.sidebarFooter}>
            <View style={styles.themeToggle}>
              <Text style={styles.toggleLabel}>Dark Mode</Text>
              <Switch value={darkMode} onValueChange={setDarkMode} />
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#e53e3e" />
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </View>

          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#718096" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const MenuSection = ({ title, children }) => (
  <View style={styles.menuSection}>
    <Text style={styles.menuSectionTitle}>{title}</Text>
    {children}
  </View>
);

const MenuItem = ({ title, icon, active, badge, onPress }) => (
  <TouchableOpacity
    style={[styles.menuItem, active && styles.activeItem]}
    onPress={onPress}
  >
    <Ionicons
      name={icon}
      size={24}
      color={active ? '#4299e1' : '#4a5568'}
      style={styles.menuIcon}
    />
    <Text style={[styles.menuText, active && { color: '#4299e1' }]}>{title}</Text>
    {badge && <Text style={styles.badge}>{badge}</Text>}
  </TouchableOpacity>
);

// (styles remain unchanged — no edits needed)
const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: '80%',
    maxWidth: 300,
    backgroundColor: 'white',
    zIndex: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 2, height: 0 },
    shadowRadius: 10,
    elevation: 10,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0'
  },
  userAvatar: {
    backgroundColor: '#4299e1',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold'
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748'
  },
  email: {
    fontSize: 14,
    color: '#718096'
  },
  sidebarMenu: {
    flex: 1,
    paddingVertical: 16
  },
  menuSection: {
    marginBottom: 24
  },
  menuSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#718096',
    paddingHorizontal: 20,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20
  },
  activeItem: {
    backgroundColor: '#ebf8ff',
    borderLeftWidth: 3,
    borderLeftColor: '#4299e1'
  },
  menuIcon: {
    marginRight: 16
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4a5568'
  },
  badge: {
    backgroundColor: '#4299e1',
    color: 'white',
    fontSize: 12,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 'auto'
  },
  sidebarFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderColor: '#f0f0f0'
  },
  themeToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4a5568'
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  logoutText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
    color: '#e53e3e'
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 20
  }
});