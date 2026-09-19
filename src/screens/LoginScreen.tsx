import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { AppScreenProps } from "../types/navigation";
import { colors, radius, spacing } from "../styles/theme";

// pantalla de inicio de sesión.
// El usuario escribe su correo y, si todo está bien, pasa a la pantalla Home.
export function LoginScreen({ navigation }: AppScreenProps<"Login">) {
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState<string | null>(null);

  //Se ejecuta cuando el usuario toca el botón "Continuar".
  const continuar = () => {
    if (!correo.includes("@")) {
      setError("Escribe un correo válido.");
      return;
    }
      const continuar = () => {
    if (!correo.includes("@")) {
      setError("Escribe un correo válido.");
      return;
    }
    if (clave.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setError(null);
    navigation.navigate("Home");
  };
    setError(null);
    navigation.navigate("Home");
  };

  return (
    <KeyboardAvoidingView
      style={styles.contenedor}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Ícono y título */}
      <View style={styles.encabezado}>
        <Text style={styles.icono}>🅿️</Text>
        <Text style={styles.titulo}>Inicia sesión o regístrate</Text>
      </View>

      {/* Campo de texto para el correo */}
      <TextInput
        style={styles.input}
        value={correo}
        onChangeText={setCorreo}
        placeholder="Número de teléfono o correo electrónico"
        placeholderTextColor={colors.textLight}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        value={clave}
        onChangeText={setClave}
        placeholder="Contraseña"
        placeholderTextColor={colors.textLight}
        secureTextEntry
      />

      {error && <Text style={styles.error}>{error}</Text>}

      {/* Botón principal */}
      <Pressable style={styles.boton} onPress={continuar}>
        <Text style={styles.botonTexto}>Continuar</Text>
      </Pressable>

      {/* Línea divisoria*/}
      <View style={styles.divisor}>
        <View style={styles.linea} />
        <Text style={styles.divisorTexto}>o</Text>
        <View style={styles.linea} />
      </View>

      {/* Enlace para ir a la pantalla de registro */}
      <Pressable onPress={() => navigation.navigate("Register")}>
        <Text style={styles.enlace}>Registrarse con correo</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  encabezado: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  icono: {
    fontSize: 40,
    marginBottom: spacing.md,
  },
  titulo: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  error: {
    color: colors.primary,
    marginBottom: spacing.md,
  },
  boton: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  botonTexto: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 16,
  },
  divisor: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  linea: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  divisorTexto: {
    marginHorizontal: spacing.sm,
    color: colors.textLight,
  },
  enlace: {
    textAlign: "center",
    color: colors.text,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});