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
  Parqueadero,
  formatearPrecio,
  obtenerMisParqueaderos,
} from "../services/parking";
import {
  Estadisticas,
  calcularEstadisticas,
  obtenerReservasRecibidas,
} from "../services/bookings";
import { useAuth } from "../context/AuthContext";
import { ImagePlaceholder } from "../components/ui";
import { colors, radius, spacing } from "../styles/theme";

// Pestaña "Explorar" del propietario: sus parqueaderos con un resumen de reservas.
export function MyParkingsScreen({ navigation }: MainTabScreenProps<"Explore">) {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const [parqueaderos, setParqueaderos] = useState<Parqueadero[] | null>(null);
  // Estadísticas por id de parqueadero.
  const [resumen, setResumen] = useState<Record<string, Estadisticas>>({});
  const [error, setError] = useState<string | null>(null);

  // Se recarga al volver a la pestaña (ej: después de publicar un parqueadero).
  useFocusEffect(
    useCallback(() => {
      if (!token) {
        setError("Debes iniciar sesión para ver tus parqueaderos.");
        return;
      }

      let activo = true;

      // Los parqueaderos y todas sus reservas se piden al mismo tiempo.
      Promise.all([obtenerMisParqueaderos(token), obtenerReservasRecibidas(token)])
        .then(([misParqueaderos, reservas]) => {
          if (!activo) return;

          const porParqueadero: Record<string, Estadisticas> = {};
          misParqueaderos.forEach((p) => {
            porParqueadero[p.id] = calcularEstadisticas(
              reservas.filter((r) => r.parqueadero.id === p.id),
            );
          });

          setParqueaderos(misParqueaderos);
          setResumen(porParqueadero);
          setError(null);
        })
        .catch((e) => {
          if (activo) {
            setError(
              e instanceof Error ? e.message : "No se pudieron cargar tus parqueaderos.",
            );
          }
        });

      return () => {
        activo = false;
      };
    }, [token]),
  );

  return (
    <View style={[styles.contenedor, { paddingTop: insets.top + spacing.md }]}>
      <Text style={styles.titulo}>Mis parqueaderos</Text>

      <Pressable
        style={styles.publicar}
        onPress={() => navigation.navigate("AddParking")}
      >
        <Feather name="plus-circle" size={20} color={colors.primary} />
        <Text style={styles.publicarTexto}>Publicar parqueadero</Text>
      </Pressable>

      <FlatList
        data={parqueaderos ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.lista}
        ItemSeparatorComponent={() => <View style={styles.separador} />}
        renderItem={({ item }) => {
          const r = resumen[item.id];
          return (
            <Pressable
              style={styles.fila}
              onPress={() =>
                navigation.navigate("MyParkingDetail", { parkingSpotId: item.id })
              }
            >
              <ImagePlaceholder
                style={styles.foto}
                iconSize={30}
                source={item.imagen}
              />
              <View style={styles.textos}>
                <Text style={styles.nombre} numberOfLines={1}>
                  {item.titulo}
                </Text>
                <Text style={styles.detalle} numberOfLines={1}>
                  {item.barrio} · {item.direccion}
                </Text>
                <Text style={styles.precio}>
                  {formatearPrecio(item.precioHora)}
                  <Text style={styles.precioUnidad}> / hora</Text>
                </Text>
                {r && (
                  <Text style={styles.resumen}>
                    {r.proximas} {r.proximas === 1 ? "próxima" : "próximas"} ·{" "}
                    {r.total} en total
                  </Text>
                )}
              </View>
              <View style={styles.derecha}>
                <Text
                  style={[styles.estado, !item.disponible && styles.estadoPausado]}
                >
                  {item.disponible ? "Disponible" : "Pausado"}
                </Text>
                <Feather name="chevron-right" size={18} color={colors.textLight} />
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          !parqueaderos && !error ? (
            <ActivityIndicator color={colors.primary} style={styles.cargando} />
          ) : (
            <Text style={styles.vacio}>
              {error ?? "Aún no has publicado parqueaderos."}
            </Text>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colors.background,
  },
  titulo: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    paddingHorizontal: 24,
  },
  publicar: {
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
  publicarTexto: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  lista: {
    paddingHorizontal: 24,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  separador: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.md,
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  foto: {
    width: 84,
    height: 84,
    borderRadius: radius.md,
  },
  textos: {
    flex: 1,
  },
  nombre: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  detalle: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 3,
  },
  precio: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
    marginTop: 4,
  },
  precioUnidad: {
    fontSize: 12,
    fontWeight: "400",
  },
  resumen: {
    fontSize: 12,
    color: colors.text,
    marginTop: 4,
  },
  derecha: {
    alignItems: "flex-end",
    gap: spacing.sm,
  },
  estado: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2E7D32",
  },
  estadoPausado: {
    color: colors.textLight,
  },
  cargando: {
    marginTop: spacing.xl,
  },
  vacio: {
    textAlign: "center",
    color: colors.textLight,
    marginTop: spacing.xl,
  },
});