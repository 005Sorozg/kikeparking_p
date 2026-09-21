import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { AppScreenProps } from "../types/navigation";
import { parkingSpots } from "../services/parking";
import { colors, radius, spacing } from "../styles/theme";

// Pantalla de detalle: muestra la información completa de un parqueadero.
// Recibe el id por la navegación y busca el parqueadero en los datos.
export function ParkingDetailScreen({
  route,
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
      <View style={styles.foto}>
        <Text style={styles.fotoIcono}>🅿️</Text>
      </View>

      <View style={styles.filaTitulo}>
        <Text style={styles.titulo}>{spot.titulo}</Text>
        <Text style={styles.calificacion}>★ {spot.calificacion}</Text>
      </View>

      <Text style={styles.barrio}>
        {spot.barrio} · {spot.direccion}
      </Text>
      <Text style={styles.precio}>
        ${spot.precioHora.toLocaleString("es-CO")} / hora
      </Text>
      <Text style={[styles.estado, !spot.disponible && styles.estadoOcupado]}>
        {spot.disponible ? "Disponible" : "Ocupado"}
      </Text>

      {/* Por ahora el botón no hace nada, la reserva se implementa después */}
      <Pressable
        style={[styles.boton, !spot.disponible && styles.botonDeshabilitado]}
        disabled={!spot.disponible}
        onPress={() => {}}
      >
        <Text style={styles.botonTexto}>Reservar</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contenido: {
    padding: spacing.md,
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
    height: 200,
    backgroundColor: "#EFEFEF",
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  fotoIcono: {
    fontSize: 56,
  },
  filaTitulo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titulo: {
    flex: 1,
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
  },
  calificacion: {
    color: colors.primary,
    fontWeight: "600",
    marginLeft: spacing.sm,
  },
  barrio: {
    color: colors.textLight,
    marginTop: spacing.xs,
  },
  precio: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing.md,
  },
  estado: {
    color: "#2E7D32",
    fontWeight: "600",
    marginTop: spacing.xs,
  },
  estadoOcupado: {
    color: colors.primary,
  },
  boton: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  botonDeshabilitado: {
    backgroundColor: colors.border,
  },
  botonTexto: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 16,
  },
});