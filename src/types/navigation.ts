import type { NativeStackScreenProps } from "@react-navigation/native-stack";

export type AppStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  ParkingDetail: { parkingSpotId: string };
  MyReservations: undefined;
};

export type AppScreenProps<T extends keyof AppStackParamList> =
  NativeStackScreenProps<AppStackParamList, T>;