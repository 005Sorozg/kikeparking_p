import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { AppScreenProps } from "../types/navigation";
import {
  BackButton,
  BrandIcon,
  Field,
  OrDivider,
  PrimaryButton,
  SocialButtons,
} from "../components/ui";
import { colors, spacing } from "../styles/theme";

// Registro: correo, teléfono, nombre, apellido y contraseña.
export function RegisterScreen({ navigation }: AppScreenProps<"Register">) {
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState<string | null>(null);

  const registrar = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) {
      setError("Escribe un correo válido.");
      return;
    }
    if (telefono.replace(/\D/g, "").length < 7) {
      setError("Escribe un número de teléfono válido.");
      return;
    }
    if (nombre.trim().length < 3) {
      setError("Escribe tu nombre completo.");
      return;
    }
    if (apellido.trim().length < 2) {
      setError("Escribe tu apellido.");
      return;
    }
    if (clave.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setError(null);
    navigation.reset({ index: 0, routes: [{ name: "Home" }] });
  };

  return (
    <View style={styles.contenedor}>
      <BackButton onPress={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.contenido}
        keyboardShouldPersistTaps="handled"
      >
        <BrandIcon size={40} />
        <Text style={styles.titulo}>Bienvenido/a</Text>

        <Field
          value={correo}
          onChangeText={setCorreo}
          placeholder="Correo electrónico"
          keyboardType="email-address"
        />
        <Field
          value={telefono}
          onChangeText={setTelefono}
          placeholder="Número de teléfono"
          keyboardType="phone-pad"
        />
        <Field
          value={nombre}
          onChangeText={setNombre}
          placeholder="Nombre Completo"
          autoCapitalize="words"
        />
        <Field
          value={apellido}
          onChangeText={setApellido}
          placeholder="Apellido"
          autoCapitalize="words"
        />
        <Field
          value={clave}
          onChangeText={setClave}
          placeholder="Contraseña"
          secureTextEntry
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <PrimaryButton label="Registrarse" onPress={registrar} />

        <OrDivider />
        <SocialButtons />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contenido: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  titulo: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  error: {
    alignSelf: "flex-start",
    color: colors.primary,
    fontSize: 12,
    marginBottom: spacing.sm,
  },
});
