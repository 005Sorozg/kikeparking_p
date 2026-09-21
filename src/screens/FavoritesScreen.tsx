import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../styles/theme";

// Pantalla de favoritos. Por ahora solo muestra el estado vacío;
// más adelante listará los parqueaderos que el usuario guarde.
export function FavoritesScreen() {
  return (
    <View style={styles.contenedor}>
      <Text style={styles.icono}>♡</Text>
      <Text style={styles.titulo}>Aún no tienes favoritos</Text>
      <Text style={styles.texto}>
        Guarda los parqueaderos que más te gusten para encontrarlos rápido.
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
    color: colors.primary,
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