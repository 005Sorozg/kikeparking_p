import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Stars } from "./Stars";
import { AvatarPlaceholder } from "./ui";
import { Resena, formatearMesResena } from "../services/reviews";
import { colors, spacing } from "../styles/theme";

// Una reseña: foto y nombre de quien la escribió, estrellas, fecha y comentario.
export function ReviewItem({ resena }: { resena: Resena }) {
  return (
    <View style={styles.contenedor}>
      <View style={styles.cabecera}>
        <AvatarPlaceholder size={32} source={resena.autor.foto} />
        <View>
          <Text style={styles.nombre}>{resena.autor.nombre}</Text>
          <View style={styles.linea}>
            <Stars value={resena.estrellas} size={11} />
            <Text style={styles.fecha}>· {formatearMesResena(resena.fecha)}</Text>
          </View>
        </View>
      </View>
      {resena.comentario && <Text style={styles.comentario}>{resena.comentario}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  cabecera: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  nombre: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  linea: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  fecha: {
    fontSize: 11,
    color: colors.textLight,
  },
  comentario: {
    fontSize: 13,
    color: colors.text,
    marginTop: spacing.sm,
    lineHeight: 18,
  },
});