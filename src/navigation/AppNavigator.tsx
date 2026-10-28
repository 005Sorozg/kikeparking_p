import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import type { AppStackParamList, MainTabParamList } from "../types/navigation";
import { LoginScreen } from "../screens/LoginScreen";
import { LoginPasswordScreen } from "../screens/LoginPasswordScreen";
import { RegisterScreen } from "../screens/RegisterScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { FavoritesScreen } from "../screens/FavoritesScreen";
import { MessagesScreen } from "../screens/MessagesScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { ParkingDetailScreen } from "../screens/ParkingDetailScreen";
import { colors } from "../styles/theme";

const Stack = createNativeStackNavigator<AppStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// La barra de abajo con las 4 pestañas principales.
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: "#4A4A4A",
        tabBarLabelStyle: { fontSize: 11, fontWeight: "500" },
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.borderLight,
        },
      }}
    >
      <Tab.Screen
        name="Explore"
        component={HomeScreen}
        options={{
          title: "Explorar",
          tabBarIcon: ({ color }) => (
            <Feather name="search" size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          title: "Favoritos",
          tabBarIcon: ({ color }) => (
            <Feather name="heart" size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{
          title: "Mensajes",
          tabBarIcon: ({ color }) => (
            <Feather name="message-circle" size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => (
            <Feather name="user" size={22} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="LoginPassword" component={LoginPasswordScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Home" component={MainTabs} />
        <Stack.Screen
          name="ParkingDetail"
          component={ParkingDetailScreen}
          options={{
            headerShown: true,
            title: "",
            headerShadowVisible: false,
            headerTintColor: colors.text,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
