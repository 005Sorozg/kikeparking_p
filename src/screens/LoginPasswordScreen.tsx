import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { AppScreenProps } from "../types/navigation";
import { BackButton, BrandIcon, Field, PrimaryButton } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { colors, spacing } from "../styles/theme";

// Segundo paso del acceso: correo ya escrito + contraseña.
export function LoginPasswordScreen({
  navigation,
  route,
}: AppScreenProps<"LoginPassword">) {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState(route.params.identifier);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    const email = identifier.trim();

    // El backend solo identifica usuarios por correo.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Por ahora solo puedes iniciar sesión con tu correo electrónico.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      // reset: así el botón "atrás" no vuelve al login.
      navigation.reset({ index: 0, routes: [{ name: "Home" }] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <BackButton onPress={() => navigation.goBack()} />

      <KeyboardAvoidingView
        style={styles.center}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <BrandIcon size={40} />
        <Text style={styles.title}>Inicia sesión</Text>

        <Field
          value={identifier}
          onChangeText={setIdentifier}
          placeholder="Correo electrónico"
          keyboardType="email-address"
        />
        <Field
          value={password}
          onChangeText={setPassword}
          placeholder="Contraseña"
          secureTextEntry
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <PrimaryButton
          label={loading ? "Entrando..." : "Continuar"}
          onPress={handleContinue}
          disabled={loading}
        />

        <Pressable style={styles.linkWrap}>
          <Text style={styles.link}>Olvidé la contraseña</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingBottom: 60,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  error: {
    alignSelf: "flex-start",
    color: colors.primary,
    fontSize: 12,
    marginBottom: spacing.sm,
  },
  linkWrap: {
    marginTop: spacing.md,
  },
  link: {
    fontSize: 12,
    color: colors.text,
    textDecorationLine: "underline",
  },
});