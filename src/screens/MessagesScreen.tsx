import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../styles/theme";

// Pantalla de mensajes. Por ahora solo muestra el estado vacío;
// más adelante tendrá las conversaciones con propietarios y conductores.
export function MessagesScreen() {
  return (
    <View style={styles.contenedor}>
      <Text style={styles.icono}>💬</Text>
      <Text style={styles.titulo}>Aún no tienes mensajes</Text>
      <Text style={styles.texto}>
        Cuando hables con un propietario o un conductor, tus conversaciones
        aparecerán aquí.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  icono: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  titulo: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  texto: {
    color: colors.textLight,
    textAlign: "center",
  },
});