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
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleContinue = () => {
    const value = identifier.trim();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    const isPhone = /^\+?[\d\s-]{7,15}$/.test(value);
    if (!isEmail && !isPhone) {
      setError("Escribe un correo o un número de teléfono válido.");
      return;
    }
    setError(null);
    navigation.navigate("LoginPassword", { identifier: value });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <BrandIcon size={40} />
      <Text style={styles.title}>Inicia sesión o regístrate</Text>

      <Field
        value={identifier}
        onChangeText={setIdentifier}
        placeholder="Número de teléfono o correo electrónico"
        keyboardType="email-address"
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <PrimaryButton label="Continuar" onPress={handleContinue} />

      <OrDivider />

      <Pressable onPress={() => navigation.navigate("Register")}>
        <Text style={styles.link}>Registrarse con correo</Text>
      </Pressable>

      <SocialButtons />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  title: {
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
  link: {
    fontSize: 12,
    color: colors.text,
    textDecorationLine: "underline",
  },
});