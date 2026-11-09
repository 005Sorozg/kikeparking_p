import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../styles/theme";

const ESTRELLAS = [1, 2, 3, 4, 5];

// Estrellas de solo lectura (ej: ★★★★☆ en una reseña).
export function Stars({ value, size = 12 }: { value: number; size?: number }) {
  return (
    <View style={styles.fila}>
      {ESTRELLAS.map((n) => (
        <Ionicons
          key={n}
          name={n <= Math.round(value) ? "star" : "star-outline"}
          size={size}
          color={colors.text}
        />
      ))}
    </View>
  );
}

// Estrellas para elegir: tocar la 4.ª deja la calificación en 4.
export function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (valor: number) => void;
}) {
  return (
    <View style={[styles.fila, styles.selector]}>
      {ESTRELLAS.map((n) => (
        <Pressable key={n} hitSlop={6} onPress={() => onChange(n)}>
          <Ionicons
            name={n <= value ? "star" : "star-outline"}
            size={34}
            color={n <= value ? colors.primary : colors.borderLight}
          />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  selector: {
    gap: 10,
    justifyContent: "center",
  },
});