import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { AppScreenProps } from "../types/navigation";
import { colors, radius, spacing } from "../styles/theme";

// Los dos tipos de usuario que puede elegir la persona al registrarse.
type Rol = "conductor" | "propietario";

// Esta es la pantalla de registro, el usuario crea su cuenta
// y elige si va a buscar parqueadero o si va a ofrecer el suyo.
export function RegisterScreen({ navigation }: AppScreenProps<"Register">) {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [rol, setRol] = useState<Rol>("conductor");
  const [error, setError] = useState<string | null>(null);

  // Se ejecuta cuando el usuario toca "Registrarse".
  // Revisamos que los datos básicos estén completos.
  const registrar = () => {
    if (nombre.trim().length < 3) {
      setError("Escribe tu nombre completo.");
      return;
    }
    if (apellido.trim().length < 3) {
      setError("Escribe tu apellido.");
      return;
    }
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

  return (
    <ScrollView
      style={styles.contenedor}
      contentContainerStyle={styles.contenido}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.icono}>🅿️</Text>
      <Text style={styles.titulo}>Bienvenido/a</Text>

      <TextInput
        style={styles.input}
        value={nombre}
        onChangeText={setNombre}
        placeholder="Nombre completo"
        placeholderTextColor={colors.textLight}
      />

      <TextInput
        style={styles.input}
        value={apellido}
        onChangeText={setApellido}
        placeholder="Apellido"
        placeholderTextColor={colors.textLight}
      />

      <TextInput
        style={styles.input}
        value={correo}
        onChangeText={setCorreo}
        placeholder="Correo electrónico"
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

      {/* Aquí el usuario elige cómo va a usar la app */}
      <Text style={styles.etiqueta}>¿Cómo vas a usar la app?</Text>
      <View style={styles.opciones}>
        <Pressable
          style={[styles.opcion, rol === "conductor" && styles.opcionActiva]}
          onPress={() => setRol("conductor")}
        >
          <Text
            style={[
              styles.opcionTexto,
              rol === "conductor" && styles.opcionTextoActivo,
            ]}
          >
            Conductor
          </Text>
        </Pressable>
        <Pressable
          style={[styles.opcion, rol === "propietario" && styles.opcionActiva]}
          onPress={() => setRol("propietario")}
        >
          <Text
            style={[
              styles.opcionTexto,
              rol === "propietario" && styles.opcionTextoActivo,
            ]}
          >
            Propietario de parqueadero
          </Text>
        </Pressable>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.boton} onPress={registrar}>
        <Text style={styles.botonTexto}>Registrarse</Text>
      </Pressable>

      <Pressable onPress={() => navigation.goBack()}>
        <Text style={styles.enlace}>Ya tengo cuenta</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contenido: {
    padding: spacing.lg,
    alignItems: "center",
  },
  icono: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  titulo: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.lg,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  etiqueta: {
    width: "100%",
    color: colors.text,
    fontWeight: "600",
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  opciones: {
    flexDirection: "row",
    width: "100%",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  opcion: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  opcionActiva: {
    borderColor: colors.primary,
    backgroundColor: "#FDECEE",
  },
  opcionTexto: {
    color: colors.textLight,
    fontWeight: "600",
  },
  opcionTextoActivo: {
    color: colors.primary,
  },
  error: {
    color: colors.primary,
    marginBottom: spacing.md,
  },
  boton: {
    width: "100%",
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  botonTexto: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 16,
  },
  enlace: {
    color: colors.text,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});