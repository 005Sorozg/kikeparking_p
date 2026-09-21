import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../types/navigation";
import { LoginScreen } from "../screens/LoginScreen";
import { RegisterScreen } from "../screens/RegisterScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { ParkingDetailScreen } from "../screens/ParkingDetailScreen";

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
         <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ title: "Crear cuenta" }}
        />  
         <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
          <Stack.Screen
          name="ParkingDetail"
          component={ParkingDetailScreen}
          options={{ title: "Detalle del parqueadero" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}