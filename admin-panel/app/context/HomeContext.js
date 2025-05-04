// app/context/HomeContext.js
'use client';
import { createContext, useContext, useState } from 'react';

const HomeContext = createContext();

export const HomeProvider = ({ children }) => {
  const [homeId, setHomeId] = useState(null);
  const [homeName, setHomeName] = useState(null);

  return (
    <HomeContext.Provider value={{ homeId, setHomeId, homeName, setHomeName }}>
      {children}
    </HomeContext.Provider>
  );
};

export const useHome = () => useContext(HomeContext);
