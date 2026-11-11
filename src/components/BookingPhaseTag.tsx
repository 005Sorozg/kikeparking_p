import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { BookingPhase } from "../services/bookings";
import { colors } from "../styles/theme";

const PHASES: Record<BookingPhase, { text: string; color: string; backdrop: string }> = {
  pending_payment: { text: "Pendiente de pago", color: "#B26A00", backdrop: "#FFF4E0" },
  expired: { text: "Pago vencido", color: colors.textLight, backdrop: colors.chip },
  upcoming: { text: "Próxima", color: "#1565C0", backdrop: "#E3F2FD" },
  in_progress: { text: "En curso", color: "#2E7D32", backdrop: "#E8F5E9" },
  completed: { text: "Completada", color: colors.textLight, backdrop: colors.chip },
  cancelled: { text: "Cancelada", color: colors.primary, backdrop: "#FDECEA" },
};

// Etiqueta de color con el estado de una reserva.
export function BookingPhaseTag({ phase: phase }: { phase: BookingPhase }) {
  const { text: text, color, backdrop: backdrop } = PHASES[phase];

  return (
    <View style={[styles.label, { backgroundColor: backdrop }]}>
      <Text style={[styles.text, { color }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  text: {
    fontSize: 11,
    fontWeight: "700",
  },
});