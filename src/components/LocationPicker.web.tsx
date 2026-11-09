import React from "react";
import { StyleSheet, Text } from "react-native";
import type { Ubicacion } from "../services/parking";
import { colors } from "../styles/theme";

// En la web no hay mapa: la ubicación se marca desde la app del celular.
// Este archivo reemplaza a LocationPicker.tsx cuando la app corre en el navegador.
export function LocationPicker(_: {
  value: Ubicacion | null;
  onChange: (ubicacion: Ubicacion, encontrado: { direccion?: string; barrio?: string }) => void;
}) {
  return <Text style={styles.aviso}>La ubicación en el mapa se marca desde la app del celular.</Text>;
}

const styles = StyleSheet.create({
  aviso: {
    fontSize: 12,
    color: colors.textLight,
  },
});