import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { AppScreenProps } from "../types/navigation";
import {
  Parqueadero,
  formatearPrecio,
  obtenerParqueadero,
} from "../services/parking";
import { ImagePlaceholder, PrimaryButton } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useFavoritos } from "../context/FavoritesContext";
import { colors, radius, spacing } from "../styles/theme";

// Detalle de un parqueadero: se pide al backend por su id.
export function ParkingDetailScreen({
  route,
  navigation,
}: AppScreenProps<"ParkingDetail">) {
  const [spot, setSpot] = useState<Parqueadero | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fotoActiva, setFotoActiva] = useState(0);
  const { usuario } = useAuth();
  const { esFavorito, alternarFavorito } = useFavoritos();

  useEffect(() => {
    let activo = true;

    obtenerParqueadero(route.params.parkingSpotId)
      .then((dato) => {
        if (activo) setSpot(dato);
      })
      .catch((e) => {
        if (activo) {
          setError(
            e instanceof Error ? e.message : "No se pudo cargar el parqueadero.",
          );
        }
      });

    return () => {
      activo = false;
    };
  }, [route.params.parkingSpotId]);

  if (error) {
    return (
      <View style={styles.centro}>
        <Text style={styles.vacio}>{error}</Text>
      </View>
    );
  }

  if (!spot) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.contenedor}
      contentContainerStyle={styles.contenido}
    >
      <View style={styles.fotoContenedor}>
        <ImagePlaceholder
          style={styles.foto}
          iconSize={96}
          source={
            spot.fotos[fotoActiva] ? { uri: spot.fotos[fotoActiva].url } : undefined
          }
        />
        {/* Solo los conductores guardan favoritos */}
        {usuario?.role === "conductor" && (
          <Pressable
            style={styles.corazon}
            hitSlop={8}
            onPress={() => alternarFavorito(spot)}
          >
            <Ionicons
              name={esFavorito(spot.id) ? "heart" : "heart-outline"}
              size={18}
              color={esFavorito(spot.id) ? colors.primary : "#B5B5B5"}
            />
          </Pressable>
        )}
      </View>

      {spot.fotos.length > 1 && (
        <View style={styles.miniaturas}>
          {spot.fotos.map((foto, indice) => (
            <Pressable key={foto.id} onPress={() => setFotoActiva(indice)}>
              <Image
                source={{ uri: foto.url }}
                style={[
                  styles.miniatura,
                  indice === fotoActiva && styles.miniaturaActiva,
                ]}
              />
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.filaTitulo}>
        <Text style={styles.titulo}>{spot.titulo}</Text>
        <View style={styles.calificacion}>
          <Ionicons name="star" size={14} color={colors.black} />
          <Text style={styles.calificacionTexto}>
            {spot.calificacion > 0 ? spot.calificacion.toFixed(1) : "Nuevo"}
          </Text>
        </View>
      </View>

      <Text style={styles.detalle}>
        {spot.barrio} · {spot.direccion}
      </Text>

      <Text style={styles.precio}>
        {formatearPrecio(spot.precioHora)}
        <Text style={styles.precioUnidad}> / hora</Text>
      </Text>
      <Text style={[styles.estado, !spot.disponible && styles.estadoOcupado]}>
        {spot.disponible ? "Disponible" : "No disponible por ahora"}
      </Text>

      <View style={styles.boton}>
        <PrimaryButton
          label="Reservar"
          onPress={() =>
            navigation.navigate("Booking", { parkingSpotId: spot.id })
          }
          disabled={!spot.disponible}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contenido: {
    padding: 18,
  },
  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  vacio: {
    color: colors.textLight,
  },
  fotoContenedor: {
    width: 280,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  foto: {
    width: 280,
    height: 280,
    borderRadius: radius.lg,
  },
  corazon: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
    miniaturas: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  miniatura: {
    width: 48,
    height: 48,
    borderRadius: 8,
    opacity: 0.6,
  },
  miniaturaActiva: {
    opacity: 1,
    borderWidth: 2,
    borderColor: colors.black,
  },
  filaTitulo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titulo: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  calificacion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: spacing.sm,
  },
  calificacionTexto: {
    fontSize: 12,
    color: colors.text,
  },
  detalle: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
  },
  precio: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing.md,
  },
  precioUnidad: {
    fontSize: 12,
    fontWeight: "400",
  },
  estado: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2E7D32",
    marginTop: spacing.xs,
  },
  estadoOcupado: {
    color: colors.primary,
  },
  boton: {
    marginTop: spacing.lg,
  },
});