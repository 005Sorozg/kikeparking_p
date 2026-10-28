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
import { colors, spacing } from "../styles/theme";

// Segundo paso del acceso: correo ya escrito + contraseña.
export function LoginPasswordScreen({
  navigation,
  route,
}: AppScreenProps<"LoginPassword">) {
  const [identificador, setIdentificador] = useState(route.params.identifier);
  const [clave, setClave] = useState("");
  const [error, setError] = useState<string | null>(null);

  const continuar = () => {
    if (identificador.trim().length === 0) {
      setError("Escribe tu correo o número de teléfono.");
      return;
    }
    if (clave.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setError(null);
    // reset: así el botón "atrás" no vuelve al login.
    navigation.reset({ index: 0, routes: [{ name: "Home" }] });
  };

  return (
    <View style={styles.contenedor}>
      <BackButton onPress={() => navigation.goBack()} />

      <KeyboardAvoidingView
        style={styles.centro}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <BrandIcon size={40} />
        <Text style={styles.titulo}>Inicia sesión</Text>

        <Field
          value={identificador}
          onChangeText={setIdentificador}
          placeholder="Correo electrónico"
          keyboardType="email-address"
        />
        <Field
          value={clave}
          onChangeText={setClave}
          placeholder="Contraseña"
          secureTextEntry
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <PrimaryButton label="Continuar" onPress={continuar} />

        <Pressable style={styles.enlaceWrap}>
          <Text style={styles.enlace}>Olvidé la contraseña</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingBottom: 60,
  },
  titulo: {
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
  enlaceWrap: {
    marginTop: spacing.md,
  },
  enlace: {
    fontSize: 12,
    color: colors.text,
    textDecorationLine: "underline",
  },
});
