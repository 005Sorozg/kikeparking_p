import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { AppScreenProps } from "../types/navigation";
import { formatearPrecio, parkingSpots } from "../services/parking";
import { bookings, esProxima, formatearRango } from "../services/bookings";
import { Chip, ImagePlaceholder } from "../components/ui";
import { colors, radius, spacing } from "../styles/theme";

type Filtro = "proximas" | "anteriores";

const FILTROS: { id: Filtro; etiqueta: string }[] = [
  { id: "proximas", etiqueta: "Próximas" },
  { id: "anteriores", etiqueta: "Anteriores" },
];

// Reservas: chips para alternar entre las próximas y las anteriores.
export function MyBookingsScreen(_: AppScreenProps<"MyBookings">) {
  const [filtro, setFiltro] = useState<Filtro>("proximas");

  const visibles = bookings.filter((b) =>
    filtro === "proximas" ? esProxima(b) : !esProxima(b),
  );

  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>Reservas</Text>

      <View style={styles.chips}>
        {FILTROS.map((f) => (
          <Chip
            key={f.id}
            label={f.etiqueta}
            variant="filled"
            selected={filtro === f.id}
            onPress={() => setFiltro(f.id)}
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.lista}>
        {visibles.length === 0 && (
          <Text style={styles.vacio}>
            No tienes reservas {filtro === "proximas" ? "próximas" : "anteriores"}.
          </Text>
        )}
        {visibles.map((b) => {
          const spot = parkingSpots.find((p) => p.id === b.parkingSpotId);
          if (!spot) return null;
          return (
            <View key={b.id} style={styles.fila}>
              <ImagePlaceholder
                style={styles.foto}
                iconSize={26}
                source={spot.imagen}
              />
              <View style={styles.textos}>
                <Text style={styles.nombre} numberOfLines={1}>
                  {spot.titulo}
                </Text>
                <Text style={styles.detalle}>
                  {spot.barrio}, {spot.ciudad}
                </Text>
                <Text style={styles.detalle}>
                  {formatearRango(b.entrada, b.dias)}
                </Text>
                <View style={styles.vehiculo}>
                  <Feather
                    name={b.vehiculo === "carro" ? "truck" : "navigation"}
                    size={11}
                    color={colors.textLight}
                  />
                  <Text style={styles.detalle}>
                    {b.vehiculo === "carro" ? "Carro" : "Moto"}
                  </Text>
                </View>
              </View>
              <Text style={styles.precio}>{formatearPrecio(b.total)}</Text>
            </View>
          );
        })}
      </ScrollView>
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
    marginBottom: spacing.md,
  },
  chips: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: 24,
    paddingBottom: spacing.md,
  },
  lista: {
    paddingHorizontal: 24,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  vacio: {
    color: colors.textLight,
    fontSize: 12,
  },
  fila: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    marginBottom: spacing.lg,
  },
  foto: {
    width: 64,
    height: 64,
    borderRadius: radius.sm,
  },
  textos: {
    flex: 1,
  },
  nombre: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.text,
  },
  detalle: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 3,
  },
  vehiculo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  precio: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
  },
});
