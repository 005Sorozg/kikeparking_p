import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import {
  NavigationContainer,
  createNavigationContainerRef,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import type { AppStackParamList, MainTabParamList } from "../types/navigation";
import { LoginScreen } from "../screens/LoginScreen";
import { LoginPasswordScreen } from "../screens/LoginPasswordScreen";
import { RegisterScreen } from "../screens/RegisterScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { MyParkingsScreen } from "../screens/MyParkingsScreen";
import { MyParkingDetailScreen } from "../screens/MyParkingDetailScreen";
import { useAuth } from "../context/AuthContext";
import { useNoLeidos } from "../context/UnreadContext";
import { FavoritesScreen } from "../screens/FavoritesScreen";
import { MessagesScreen } from "../screens/MessagesScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { ParkingDetailScreen } from "../screens/ParkingDetailScreen";
import { BookingScreen } from "../screens/BookingScreen";
import { MyBookingsScreen } from "../screens/MyBookingsScreen";
import { PaymentScreen } from "../screens/PaymentScreen";
import { AddParkingScreen } from "../screens/AddParkingScreen";
import { EditParkingScreen } from "../screens/EditParkingScreen";
import { ChatScreen } from "../screens/ChatScreen";
import { FavoriteCollectionScreen } from "../screens/FavoriteCollectionScreen";
import { colors } from "../styles/theme";
import { HelpScreen } from "../screens/HelpScreen";
import { AccountSettingsScreen } from "../screens/AccountSettingsScreen";

// Permite navegar desde fuera de una pantalla (ej: mandar al login si la sesión vence).
const navigationRef = createNavigationContainerRef<AppStackParamList>();

// Pantallas a las que se puede estar sin sesión.
const PANTALLAS_SIN_SESION = ["Login", "LoginPassword", "Register"];

// Encabezado de las pantallas que se abren encima de las pestañas.
const encabezado = {
  headerShown: true,
  headerShadowVisible: false,
  headerTintColor: colors.text,
} as const;

const Stack = createNativeStackNavigator<AppStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// La barra de abajo con las 4 pestañas principales.
function MainTabs() {
  const { usuario } = useAuth();
  const esPropietario = usuario?.role === "propietario";
  const { noLeidos } = useNoLeidos();
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
        component={esPropietario ? MyParkingsScreen : HomeScreen}
        options={{
          // "Mis parqueaderos" no cabe en la barra de abajo
          title: esPropietario ? "Parqueaderos" : "Explorar",
          tabBarIcon: ({ color }) => (
            <Feather
              name={esPropietario ? "home" : "search"}
              size={22}
              color={color}
            />
          ),
        }}
      />
      {/* Los favoritos son de los conductores: al propietario no se le muestra la pestaña */}
      {!esPropietario && (
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
      )}
      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{
          title: "Mensajes",
          tabBarIcon: ({ color }) => (
            <Feather name="message-circle" size={22} color={color} />
          ),
          // Número rojo con los mensajes sin leer (no se muestra si es 0)
          tabBarBadge: noLeidos > 0 ? (noLeidos > 99 ? "99+" : noLeidos) : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.primary, fontSize: 10 },
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
  const { usuario, cargando } = useAuth();

  // Si la sesión se cierra estando dentro de la app (ej: el backend rechazó el token
  // porque venció), se vuelve al login.
  useEffect(() => {
    if (cargando || usuario || !navigationRef.isReady()) return;

    const actual = navigationRef.getCurrentRoute()?.name;
    if (actual && !PANTALLAS_SIN_SESION.includes(actual)) {
      navigationRef.reset({ index: 0, routes: [{ name: "Login" }] });
    }
  }, [usuario, cargando]);

  // Mientras se lee la sesión guardada no se sabe si empezar en Login o en Home.
  if (cargando) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        // Con sesión guardada se entra directo a la app
        initialRouteName={usuario ? "Home" : "Login"}
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
        <Stack.Screen
          name="Booking"
          component={BookingScreen}
          options={{ ...encabezado, title: "" }}
        />
        <Stack.Screen
          name="Payment"
          component={PaymentScreen}
          options={{ ...encabezado, title: "" }}
        />
        <Stack.Screen
          name="MyBookings"
          component={MyBookingsScreen}
          options={{ ...encabezado, title: "" }}
        />
        <Stack.Screen
          name="AddParking"
          component={AddParkingScreen}
          options={{ ...encabezado, title: "" }}
        />
        <Stack.Screen
          name="FavoriteCollection"
          component={FavoriteCollectionScreen}
          options={{ ...encabezado, title: "" }}
        />
        <Stack.Screen
          name="MyParkingDetail"
          component={MyParkingDetailScreen}
          options={{ ...encabezado, title: "" }}
        />
        <Stack.Screen
          name="EditParking"
          component={EditParkingScreen}
          options={{ ...encabezado, title: "" }}
        />
        <Stack.Screen
          name="Chat"
          component={ChatScreen}
          // El título (nombre de la otra persona) lo pone la pantalla del chat
          options={{ ...encabezado, title: "" }}
        />
        <Stack.Screen
          name="Help"
          component={HelpScreen}
          options={{ ...encabezado, title: "" }}
        />
                <Stack.Screen
          name="AccountSettings"
          component={AccountSettingsScreen}
          options={{ ...encabezado, title: "" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
