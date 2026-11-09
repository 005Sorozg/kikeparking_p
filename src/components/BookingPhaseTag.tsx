import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { FaseReserva } from "../services/bookings";
import { colors } from "../styles/theme";

const FASES: Record<FaseReserva, { texto: string; color: string; fondo: string }> = {
  upcoming: { texto: "Próxima", color: "#1565C0", fondo: "#E3F2FD" },
  in_progress: { texto: "En curso", color: "#2E7D32", fondo: "#E8F5E9" },
  completed: { texto: "Completada", color: colors.textLight, fondo: colors.chip },
  cancelled: { texto: "Cancelada", color: colors.primary, fondo: "#FDECEA" },
};

// Etiqueta de color con el estado de una reserva.
export function BookingPhaseTag({ fase }: { fase: FaseReserva }) {
  const { texto, color, fondo } = FASES[fase];

  return (
    <View style={[styles.etiqueta, { backgroundColor: fondo }]}>
      <Text style={[styles.texto, { color }]}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  etiqueta: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  texto: {
    fontSize: 11,
    fontWeight: "700",
  },
});