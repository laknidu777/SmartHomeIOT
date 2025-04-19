import "react-native-gesture-handler";
//import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
//import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Login from "./screens/Login";
import Signup from "./screens/Signup";
import Home from "./screens/Home";
import User from "./screens/User";
import SelectHome from "./screens/SelectHome";
import SplashScreen from "./screens/SplashScreen";
import ConfigureDevices from "./screens/ConfigureDevices";
import AppLayout from "./components/AppLayout";
import CategoryPage from "./screens/CategoryPage";
import DevicePage from "./screens/DevicePage"
import SupportPage from "./screens/SupportPage";
const Stack = createStackNavigator();
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Login">
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="SplashScreen" component={SplashScreen} />
        <Stack.Screen
          name="Home"
          children={({ navigation }) => (
            <AppLayout navigation={navigation}>
              <Home />
            </AppLayout>
          )}
        />
        <Stack.Screen
          name="CategoryPage"
          children={({ navigation }) => (
            <AppLayout navigation={navigation}>
              <CategoryPage />
            </AppLayout>
          )}
        />
        <Stack.Screen
          name="DevicePage"
          children={({ navigation, route }) => (
            <AppLayout navigation={navigation}>
              <DevicePage route={route} navigation={navigation} />
            </AppLayout>
          )}
        />
        <Stack.Screen
          name="SupportPage"
          children={({ navigation, route }) => (
            <AppLayout navigation={navigation}>
              <SupportPage route={route} navigation={navigation} />
            </AppLayout>
          )}
        />
        
        <Stack.Screen name="ConfigureDevices" component={ConfigureDevices} 
        options={{ headerShown: false }}
        />
        <Stack.Screen name="User" component={User} />
        <Stack.Screen name="Signup" component={Signup} />
        <Stack.Screen name="SelectHome" component={SelectHome} />
        
  
      </Stack.Navigator>
    </NavigationContainer>
  );
}
