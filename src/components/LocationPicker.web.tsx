import React from "react";
import { StyleSheet, Text } from "react-native";
import type { Coordinates } from "../services/parking";
import { colors } from "../styles/theme";

// En la web no hay mapa: la ubicación se marca desde la app del celular.
// Este archivo reemplaza a LocationPicker.tsx cuando la app corre en el navegador.
export function LocationPicker(_: {
  value: Coordinates | null;
  onChange: (location: Coordinates, found: { address?: string; neighborhood?: string }) => void;
}) {
  return <Text style={styles.notice}>La ubicación en el mapa se marca desde la app del celular.</Text>;
}

const styles = StyleSheet.create({
  notice: {
    fontSize: 12,
    color: colors.textLight,
  },
});