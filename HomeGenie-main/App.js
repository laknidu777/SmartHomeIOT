// App.js
import "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Login from "./screens/Login";
import Signup from "./screens/Signup";
import Home from "./screens/Home";
import User from "./screens/User";
import AddItem from "./screens/AddItem";
import SelectVehicle from "./screens/SelectHome";
import SelectHome from "./screens/SelectHome";
import AddCategory from "./screens/AddCategory";
import SplashScreen from "./screens/SplashScreen";
import FirebaseTest from "./screens/FirebaseTest";
import AppLayout from "./components/AppLayout";

import { useEffect } from "react";
import { getDoc, doc } from "firebase/firestore";
import { db } from "./firebaseConfig";

const Stack = createStackNavigator();
export default function App() {
  useEffect(() => {
    const testConnection = async () => {
      try {
        const docRef = doc(db, "test", "connection");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          console.log("✅ Firebase is connected!", docSnap.data());
        } else {
          console.log("⚠️ Test document does not exist.");
        }
      } catch (error) {
        console.error("❌ Firebase connection error:", error);
      }
    };

    testConnection();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Login">
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="SplashScreen" component={SplashScreen} />
        <Stack.Screen
          name="Home"
          children={() => (
            <AppLayout>
              <Home />
            </AppLayout>
          )}
        />
        <Stack.Screen name="AddItem" component={AddItem} />
        <Stack.Screen name="AddCategory" component={AddCategory} />
        <Stack.Screen name="User" component={User} />
        <Stack.Screen name="Signup" component={Signup} />
        <Stack.Screen name="SelectHome" component={SelectHome} />
        <Stack.Screen name="SelectVehicle" component={SelectVehicle} />
  
      </Stack.Navigator>
    </NavigationContainer>
  );
}
