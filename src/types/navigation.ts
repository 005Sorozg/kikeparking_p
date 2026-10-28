import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type {
  CompositeScreenProps,
  NavigatorScreenParams,
} from "@react-navigation/native";

// Las 4 pestañas de la barra de abajo.
export type MainTabParamList = {
  Explore: undefined;
  Favorites: undefined;
  Messages: undefined;
  Profile: undefined;
};

export type AppStackParamList = {
  Login: undefined;
  LoginPassword: { identifier: string };
  Register: undefined;
  // "Home" es el contenedor de las pestañas.
  Home: NavigatorScreenParams<MainTabParamList> | undefined;
  ParkingDetail: { parkingSpotId: string };
  Booking: { parkingSpotId: string };
  MyBookings: undefined;
  Chat: { conversationId: string };
};

export type AppScreenProps<T extends keyof AppStackParamList> =
  NativeStackScreenProps<AppStackParamList, T>;

// Props de las pantallas que viven dentro de las pestañas.
export type MainTabScreenProps<T extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    NativeStackScreenProps<AppStackParamList>
  >;
