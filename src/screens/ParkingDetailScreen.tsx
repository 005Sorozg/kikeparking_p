import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { AppScreenProps } from "../types/navigation";
import { formatearPrecio, parkingSpots } from "../services/parking";
import { ImagePlaceholder, PrimaryButton } from "../components/ui";
import { colors, radius, spacing } from "../styles/theme";

// Detalle de un parqueadero (el Figma aún no tiene esta pantalla: usa el mismo estilo del resto).
export function ParkingDetailScreen({
  route,
  navigation,
}: AppScreenProps<"ParkingDetail">) {
  const spot = parkingSpots.find((p) => p.id === route.params.parkingSpotId);

  if (!spot) {
    return (
      <View style={styles.centro}>
        <Text style={styles.vacio}>No encontramos este parqueadero.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.contenedor}
      contentContainerStyle={styles.contenido}
    >
      <ImagePlaceholder
        style={styles.foto}
        iconSize={96}
        source={spot.imagen}
      />

      <View style={styles.filaTitulo}>
        <Text style={styles.titulo}>{spot.titulo}</Text>
        <View style={styles.calificacion}>
          <Ionicons name="star" size={14} color={colors.black} />
          <Text style={styles.calificacionTexto}>{spot.calificacion}</Text>
        </View>
      </View>

      <Text style={styles.detalle}>
        {spot.barrio}, {spot.ciudad} · {spot.direccion}
      </Text>
      <Text style={styles.detalle}>
        {spot.distanciaKm.toFixed(1)} km de distancia
      </Text>
      <Text style={styles.detalle}>{spot.etiquetas.join(" • ")}</Text>

      <Text style={styles.precio}>
        {formatearPrecio(spot.precioDia)}
        <Text style={styles.precioUnidad}> / día</Text>
      </Text>
      <Text style={[styles.estado, !spot.disponible && styles.estadoOcupado]}>
        {spot.disponible ? "Disponible" : "Ocupado"}
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
  foto: {
    width: 280,
    height: 280,
    alignSelf: "center",
    borderRadius: radius.lg,
    marginBottom: spacing.md,
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
