import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { CommonActions } from "@react-navigation/native";
import type { MainTabScreenProps } from "../types/navigation";
import { colors, radius, spacing } from "../styles/theme";

// Pantalla de perfil. Por ahora muestra datos ficticios;
// más adelante vendrán del usuario que inició sesión.
export function ProfileScreen({ navigation }: MainTabScreenProps<"Profile">) {
  // Cerrar sesión: reinicia la navegación para que no se pueda volver atrás.
  const cerrarSesion = () => {
    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: "Login" }] })
    );
  };

  return (
    <View style={styles.contenedor}>
      <View style={styles.avatar}>
        <Text style={styles.avatarTexto}>👤</Text>
      </View>
      <Text style={styles.nombre}>Nombre Apellido</Text>
      <Text style={styles.correo}>correo@ejemplo.com</Text>

      <View style={styles.tarjeta}>
        <Text style={styles.etiqueta}>Tipo de cuenta</Text>
        <Text style={styles.valor}>Conductor</Text>
      </View>

      <Pressable style={styles.boton} onPress={cerrarSesion}>
        <Text style={styles.botonTexto}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    padding: spacing.lg,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#EFEFEF",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  avatarTexto: {
    fontSize: 44,
  },
  nombre: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
  },
  correo: {
    color: colors.textLight,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  tarjeta: {
    width: "100%",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  etiqueta: {
    color: colors.textLight,
    fontSize: 13,
  },
  valor: {
    color: colors.text,
    fontWeight: "600",
    marginTop: spacing.xs,
  },
  boton: {
    width: "100%",
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  botonTexto: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 16,
  },
});