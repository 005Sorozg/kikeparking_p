import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../types/navigation";
import { LoginScreen } from "../screens/LoginScreen";
import { RegisterScreen } from "../screens/RegisterScreen";

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
      </Stack.Navigator>
    </NavigationContainer>
  );
}