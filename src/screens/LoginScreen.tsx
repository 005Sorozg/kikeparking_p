import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
} from "react-native";
import type { AppScreenProps } from "../types/navigation";
import {
  BrandIcon,
  Field,
  OrDivider,
  PrimaryButton,
  SocialButtons,
} from "../components/ui";
import { colors, spacing } from "../styles/theme";

// Primer paso del acceso: correo o teléfono. Al continuar pasa a pedir la contraseña.
export function LoginScreen({ navigation }: AppScreenProps<"Login">) {
  const [identificador, setIdentificador] = useState("");
  const [error, setError] = useState<string | null>(null);

  const continuar = () => {
    const valor = identificador.trim();
    const esCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
    const esTelefono = /^\+?[\d\s-]{7,15}$/.test(valor);
    if (!esCorreo && !esTelefono) {
      setError("Escribe un correo o un número de teléfono válido.");
      return;
    }
    setError(null);
    navigation.navigate("LoginPassword", { identifier: valor });
  };

  return (
    <KeyboardAvoidingView
      style={styles.contenedor}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <BrandIcon size={40} />
      <Text style={styles.titulo}>Inicia sesión o regístrate</Text>

      <Field
        value={identificador}
        onChangeText={setIdentificador}
        placeholder="Número de teléfono o correo electrónico"
        keyboardType="email-address"
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <PrimaryButton label="Continuar" onPress={continuar} />

      <OrDivider />

      <Pressable onPress={() => navigation.navigate("Register")}>
        <Text style={styles.enlace}>Registrarse con correo</Text>
      </Pressable>

      <SocialButtons />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  titulo: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  error: {
    alignSelf: "flex-start",
    color: colors.primary,
    fontSize: 12,
    marginBottom: spacing.sm,
  },
  enlace: {
    fontSize: 12,
    color: colors.text,
    textDecorationLine: "underline",
  },
});
