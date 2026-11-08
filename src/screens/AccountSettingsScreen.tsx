import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
} from "react-native";
import { Field, PrimaryButton } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { actualizarPerfil, cambiarPassword } from "../services/profile";
import { colors, spacing } from "../styles/theme";

// Configuración de la cuenta (conductor y propietario): editar nombre y correo
// y cambiar la contraseña.
export function AccountSettingsScreen() {
  const { usuario, token, actualizarUsuario } = useAuth();

  // Datos personales
  const [nombre, setNombre] = useState(usuario?.name ?? "");
  const [correo, setCorreo] = useState(usuario?.email ?? "");
  const [guardandoDatos, setGuardandoDatos] = useState(false);
  const [errorDatos, setErrorDatos] = useState<string | null>(null);
  const [okDatos, setOkDatos] = useState<string | null>(null);

  // Contraseña
  const [claveActual, setClaveActual] = useState("");
  const [claveNueva, setClaveNueva] = useState("");
  const [claveRepetida, setClaveRepetida] = useState("");
  const [guardandoClave, setGuardandoClave] = useState(false);
  const [errorClave, setErrorClave] = useState<string | null>(null);
  const [okClave, setOkClave] = useState<string | null>(null);

  const guardarDatos = async () => {
    if (!token || !usuario) return;

    setErrorDatos(null);
    setOkDatos(null);

    if (nombre.trim().length < 3) {
      setErrorDatos("Escribe tu nombre completo.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) {
      setErrorDatos("Escribe un correo válido.");
      return;
    }

    // Solo se envía lo que cambió
    const cambios: { name?: string; email?: string } = {};
    if (nombre.trim() !== usuario.name) cambios.name = nombre.trim();
    if (correo.trim().toLowerCase() !== usuario.email) {
      cambios.email = correo.trim();
    }

    if (Object.keys(cambios).length === 0) {
      setOkDatos("No hay cambios por guardar.");
      return;
    }

    setGuardandoDatos(true);

    try {
      const actualizado = await actualizarPerfil(cambios, token);
      // Guarda el usuario nuevo en la sesión para que toda la app lo vea
      await actualizarUsuario(actualizado);
      setNombre(actualizado.name);
      setCorreo(actualizado.email);
      setOkDatos("Datos actualizados.");
    } catch (e) {
      setErrorDatos(
        e instanceof Error ? e.message : "No se pudieron guardar los cambios.",
      );
    } finally {
      setGuardandoDatos(false);
    }
  };

  const guardarClave = async () => {
    if (!token) return;

    setErrorClave(null);
    setOkClave(null);

    if (claveActual.length === 0) {
      setErrorClave("Escribe tu contraseña actual.");
      return;
    }
    if (claveNueva.length < 6) {
      setErrorClave("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (claveNueva === claveActual) {
      setErrorClave("La nueva contraseña debe ser distinta a la actual.");
      return;
    }
    if (claveNueva !== claveRepetida) {
      setErrorClave("Las contraseñas nuevas no coinciden.");
      return;
    }

    setGuardandoClave(true);

    try {
      await cambiarPassword(claveActual, claveNueva, token);
      setClaveActual("");
      setClaveNueva("");
      setClaveRepetida("");
      setOkClave("Contraseña actualizada.");
    } catch (e) {
      setErrorClave(
        e instanceof Error ? e.message : "No se pudo cambiar la contraseña.",
      );
    } finally {
      setGuardandoClave(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.contenedor}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.contenido}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.titulo}>Configuración de la cuenta</Text>

        <Text style={styles.seccion}>Datos personales</Text>
        <Field
          value={nombre}
          onChangeText={setNombre}
          placeholder="Nombre completo"
          autoCapitalize="words"
        />
        <Field
          value={correo}
          onChangeText={setCorreo}
          placeholder="Correo electrónico"
          keyboardType="email-address"
        />
        {errorDatos && <Text style={styles.error}>{errorDatos}</Text>}
        {okDatos && <Text style={styles.exito}>{okDatos}</Text>}
        <PrimaryButton
          label={guardandoDatos ? "Guardando..." : "Guardar cambios"}
          onPress={guardarDatos}
          disabled={guardandoDatos}
        />

        <Text style={[styles.seccion, styles.seccionSeparada]}>
          Cambiar contraseña
        </Text>
        <Field
          value={claveActual}
          onChangeText={setClaveActual}
          placeholder="Contraseña actual"
          secureTextEntry
        />
        <Field
          value={claveNueva}
          onChangeText={setClaveNueva}
          placeholder="Nueva contraseña"
          secureTextEntry
        />
        <Field
          value={claveRepetida}
          onChangeText={setClaveRepetida}
          placeholder="Repite la nueva contraseña"
          secureTextEntry
        />
        {errorClave && <Text style={styles.error}>{errorClave}</Text>}
        {okClave && <Text style={styles.exito}>{okClave}</Text>}
        <PrimaryButton
          label={guardandoClave ? "Guardando..." : "Cambiar contraseña"}
          onPress={guardarClave}
          disabled={guardandoClave}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contenido: {
    paddingHorizontal: 24,
    paddingBottom: spacing.xl,
  },
  titulo: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.lg,
  },
  seccion: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  seccionSeparada: {
    marginTop: spacing.xl,
  },
  error: {
    color: colors.primary,
    fontSize: 12,
    marginBottom: spacing.sm,
  },
  exito: {
    color: "#2E7D32",
    fontSize: 12,
    marginBottom: spacing.sm,
  },
});