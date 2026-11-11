import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { MainTabScreenProps } from "../types/navigation";
import {
  ParkingSpot,
  formatPrice,
  getMyParkingSpots,
} from "../services/parking";
import {
  Stats,
  calculateStats,
  getReceivedBookings,
} from "../services/bookings";
import { useAuth } from "../context/AuthContext";
import { ImagePlaceholder } from "../components/ui";
import { colors, radius, spacing } from "../styles/theme";

// Pestaña "Explorar" del propietario: sus parqueaderos con un resumen de reservas.
export function MyParkingsScreen({ navigation }: MainTabScreenProps<"Explore">) {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const [mockParkingSpots, setMockParkingSpots] = useState<ParkingSpot[] | null>(null);
  // Estadísticas por id de parqueadero.
  const [summary, setSummary] = useState<Record<string, Stats>>({});
  const [error, setError] = useState<string | null>(null);

  // Se recarga al volver a la pestaña (ej: después de publicar un parqueadero).
  useFocusEffect(
    useCallback(() => {
      if (!token) {
        setError("Debes iniciar sesión para ver tus parqueaderos.");
        return;
      }

      let active = true;

      // Los parqueaderos y todas sus reservas se piden al mismo tiempo.
      Promise.all([getMyParkingSpots(token), getReceivedBookings(token)])
        .then(([myParkingSpots, bookings]) => {
          if (!active) return;

          const bySpot: Record<string, Stats> = {};
          myParkingSpots.forEach((p) => {
            bySpot[p.id] = calculateStats(
              bookings.filter((r) => r.parkingSpot.id === p.id),
            );
          });

          setMockParkingSpots(myParkingSpots);
          setSummary(bySpot);
          setError(null);
        })
        .catch((e) => {
          if (active) {
            setError(
              e instanceof Error ? e.message : "No se pudieron cargar tus parqueaderos.",
            );
          }
        });

      return () => {
        active = false;
      };
    }, [token]),
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      <Text style={styles.title}>Mis parqueaderos</Text>

      <Pressable
        style={styles.publish}
        onPress={() => navigation.navigate("AddParking")}
      >
        <Feather name="plus-circle" size={20} color={colors.primary} />
        <Text style={styles.publishText}>Publicar parqueadero</Text>
      </Pressable>

      <FlatList
        data={mockParkingSpots ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => {
          const r = summary[item.id];
          return (
            <Pressable
              style={styles.row}
              onPress={() =>
                navigation.navigate("MyParkingDetail", { parkingSpotId: item.id })
              }
            >
              <ImagePlaceholder
                style={styles.photo}
                iconSize={30}
                source={item.image}
              />
              <View style={styles.texts}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.detail} numberOfLines={1}>
                  {item.neighborhood} · {item.address}
                </Text>
                <Text style={styles.price}>
                  {formatPrice(item.pricePerHour)}
                  <Text style={styles.priceUnit}> / hora</Text>
                </Text>
                {r && (
                  <Text style={styles.summary}>
                    {r.upcomingBookings} {r.upcomingBookings === 1 ? "próxima" : "próximas"} ·{" "}
                    {r.total} en total
                  </Text>
                )}
              </View>
              <View style={styles.rightSide}>
                <Text
                  style={[styles.status, !item.available && styles.statusPaused]}
                >
                  {item.available ? "Disponible" : "Pausado"}
                </Text>
                <Feather name="chevron-right" size={18} color={colors.textLight} />
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          !mockParkingSpots && !error ? (
            <ActivityIndicator color={colors.primary} style={styles.loading} />
          ) : (
            <Text style={styles.empty}>
              {error ?? "Aún no has publicado parqueaderos."}
            </Text>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    paddingHorizontal: 24,
  },
  publish: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginHorizontal: 24,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  publishText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  list: {
    paddingHorizontal: 24,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  separator: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  photo: {
    width: 84,
    height: 84,
    borderRadius: radius.md,
  },
  texts: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  detail: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 3,
  },
  price: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
    marginTop: 4,
  },
  priceUnit: {
    fontSize: 12,
    fontWeight: "400",
  },
  summary: {
    fontSize: 12,
    color: colors.text,
    marginTop: 4,
  },
  rightSide: {
    alignItems: "flex-end",
    gap: spacing.sm,
  },
  status: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2E7D32",
  },
  statusPaused: {
    color: colors.textLight,
  },
  loading: {
    marginTop: spacing.xl,
  },
  empty: {
    textAlign: "center",
    color: colors.textLight,
    marginTop: spacing.xl,
  },
});