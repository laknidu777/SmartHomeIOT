import "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Login from "./screens/Login";
import Signup from "./screens/Signup"; // Import the Signup screen
import Home from "./screens/Home";
import User from "./screens/User";
import AddItem from "./screens/AddItem"; // Import the new screen
import SelectVehicle from "./screens/SelectHome"; // Import the new screen
import SelectHome from "./screens/SelectHome"; // Import SelectHome screen
import SplashScreen from "./screens/SplashScreen"; // Import the SplashScreen component
import { Octicons } from "@expo/vector-icons";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "Home") {
            iconName = "home";
          } else if (route.name === "User") {
            iconName = "person";
          }

          // Change color for active button
          color = focused ? "#1c1c1c" : color;

          return <Octicons name={iconName} color={color} size={size} />;
        },
        tabBarActiveTintColor: "#1c1c1c", // Change active text color
      })}
    >
      <Tab.Screen
        name="Home"
        component={Home}
        options={{
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="User"
        component={User}
        options={{
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <>
      <StatusBar backgroundColor="#fff" barStyle="light-content" />
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen
            name="Login"
            component={Login}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Signup"
            component={Signup}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="HomeTabs"
            component={HomeTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AddItem"
            component={AddItem}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SelectVehicle"
            component={SelectVehicle}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SelectHome"
            component={SelectHome}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SplashScreen"
            component={SplashScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
