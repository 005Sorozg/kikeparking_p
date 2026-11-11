import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { AppScreenProps } from "../types/navigation";
import {
  BackButton,
  BrandIcon,
  Chip,
  Field,
  OrDivider,
  PrimaryButton,
  SocialButtons,
} from "../components/ui";
import { colors, spacing } from "../styles/theme";
import { useAuth } from "../context/AuthContext";

// Registro: correo, teléfono, nombre, apellido y contraseña.
export function RegisterScreen({ navigation }: AppScreenProps<"Register">) {
  const { register: createAccount } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"conductor" | "propietario" | null>(null);
  const [error, setError] = useState<string | null>(null);

    const register = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Escribe un correo válido.");
      return;
    }
    if (phone.replace(/\D/g, "").length < 7) {
      setError("Escribe un número de teléfono válido.");
      return;
    }
    if (name.trim().length < 3) {
      setError("Escribe tu nombre completo.");
      return;
    }
    if (lastName.trim().length < 2) {
      setError("Escribe tu apellido.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (!role) {
      setError("Elige si quieres ser conductor o propietario.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // El backend guarda un solo campo "name", así que juntamos nombre y apellido.
      // El teléfono no se envía porque el backend todavía no lo guarda.
      await createAccount({
        name: `${name.trim()} ${lastName.trim()}`,
        email: email.trim(),
        password,
        role,
      });
      navigation.reset({ index: 0, routes: [{ name: "Home" }] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear la cuenta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <BackButton onPress={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <BrandIcon size={40} />
        <Text style={styles.title}>Bienvenido/a</Text>

        <Field
          value={email}
          onChangeText={setEmail}
          placeholder="Correo electrónico"
          keyboardType="email-address"
        />
        <Field
          value={phone}
          onChangeText={setPhone}
          placeholder="Número de teléfono"
          keyboardType="phone-pad"
        />
        <Field
          value={name}
          onChangeText={setName}
          placeholder="Nombre"
          autoCapitalize="words"
        />
        <Field
          value={lastName}
          onChangeText={setLastName}
          placeholder="Apellido"
          autoCapitalize="words"
        />
        <Field
          value={password}
          onChangeText={setPassword}
          placeholder="Contraseña"
          secureTextEntry
        />
        <Text style={styles.roleLabel}>¿Cómo quieres usar Kike Parking?</Text>
        <View style={styles.roleRow}>
          <Chip
            label="Conductor"
            selected={role === "conductor"}
            onPress={() => setRole("conductor")}
          />
          <Chip
            label="Propietario"
            selected={role === "propietario"}
            onPress={() => setRole("propietario")}
          />
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <PrimaryButton
          label={loading ? "Registrando..." : "Registrarse"}
          onPress={register}
          disabled={loading}
        />

        <OrDivider />
        <SocialButtons />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  title: {
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
  roleLabel: {
    alignSelf: "flex-start",
    fontSize: 12,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  roleRow: {
    flexDirection: "row",
    gap: spacing.sm,
    alignSelf: "flex-start",
    marginBottom: spacing.sm,
  },
});
