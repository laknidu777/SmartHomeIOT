import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const RoleContext = createContext();

export const RoleProvider = ({ children }) => {
  const [role, setRole] = useState(null);
  const [homeId, setHomeId] = useState(null);

  useEffect(() => {
    const loadRoleData = async () => {
      const savedRole = await AsyncStorage.getItem('selectedHomeRole');
      const savedHomeId = await AsyncStorage.getItem('selectedHomeId');
      if (savedRole) setRole(savedRole);
      if (savedHomeId) setHomeId(savedHomeId);
    };
    loadRoleData();
  }, []);

  return (
    <RoleContext.Provider value={{ role, setRole, homeId, setHomeId }}>
      {children}
    </RoleContext.Provider>
  );
};
