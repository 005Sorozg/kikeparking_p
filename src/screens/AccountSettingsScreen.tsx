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
import { updateProfile, changePassword } from "../services/profile";
import { colors, spacing } from "../styles/theme";

// Configuración de la cuenta (conductor y propietario): editar nombre y correo
// y cambiar la contraseña.
export function AccountSettingsScreen() {
  const { user: user, token, updateUser: updateUser } = useAuth();

  // Datos personales
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [savingData, setSavingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [dataOk, setDataOk] = useState<string | null>(null);

  // Contraseña
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatedPassword, setRepeatedPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordOk, setPasswordOk] = useState<string | null>(null);

  const saveData = async () => {
    if (!token || !user) return;

    setDataError(null);
    setDataOk(null);

    if (name.trim().length < 3) {
      setDataError("Escribe tu nombre completo.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setDataError("Escribe un correo válido.");
      return;
    }

    // Solo se envía lo que cambió
    const changes: { name?: string; email?: string } = {};
    if (name.trim() !== user.name) changes.name = name.trim();
    if (email.trim().toLowerCase() !== user.email) {
      changes.email = email.trim();
    }

    if (Object.keys(changes).length === 0) {
      setDataOk("No hay cambios por guardar.");
      return;
    }

    setSavingData(true);

    try {
      const updated = await updateProfile(changes, token);
      // Guarda el usuario nuevo en la sesión para que toda la app lo vea
      await updateUser(updated);
      setName(updated.name);
      setEmail(updated.email);
      setDataOk("Datos actualizados.");
    } catch (e) {
      setDataError(
        e instanceof Error ? e.message : "No se pudieron guardar los cambios.",
      );
    } finally {
      setSavingData(false);
    }
  };

  const savePassword = async () => {
    if (!token) return;

    setPasswordError(null);
    setPasswordOk(null);

    if (currentPassword.length === 0) {
      setPasswordError("Escribe tu contraseña actual.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError("La nueva contraseña debe ser distinta a la actual.");
      return;
    }
    if (newPassword !== repeatedPassword) {
      setPasswordError("Las contraseñas nuevas no coinciden.");
      return;
    }

    setSavingPassword(true);

    try {
      await changePassword(currentPassword, newPassword, token);
      setCurrentPassword("");
      setNewPassword("");
      setRepeatedPassword("");
      setPasswordOk("Contraseña actualizada.");
    } catch (e) {
      setPasswordError(
        e instanceof Error ? e.message : "No se pudo cambiar la contraseña.",
      );
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Configuración de la cuenta</Text>

        <Text style={styles.section}>Datos personales</Text>
        <Field
          value={name}
          onChangeText={setName}
          placeholder="Nombre completo"
          autoCapitalize="words"
        />
        <Field
          value={email}
          onChangeText={setEmail}
          placeholder="Correo electrónico"
          keyboardType="email-address"
        />
        {dataError && <Text style={styles.error}>{dataError}</Text>}
        {dataOk && <Text style={styles.success}>{dataOk}</Text>}
        <PrimaryButton
          label={savingData ? "Guardando..." : "Guardar cambios"}
          onPress={saveData}
          disabled={savingData}
        />

        <Text style={[styles.section, styles.sectionSeparated]}>
          Cambiar contraseña
        </Text>
        <Field
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="Contraseña actual"
          secureTextEntry
        />
        <Field
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Nueva contraseña"
          secureTextEntry
        />
        <Field
          value={repeatedPassword}
          onChangeText={setRepeatedPassword}
          placeholder="Repite la nueva contraseña"
          secureTextEntry
        />
        {passwordError && <Text style={styles.error}>{passwordError}</Text>}
        {passwordOk && <Text style={styles.success}>{passwordOk}</Text>}
        <PrimaryButton
          label={savingPassword ? "Guardando..." : "Cambiar contraseña"}
          onPress={savePassword}
          disabled={savingPassword}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.lg,
  },
  section: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  sectionSeparated: {
    marginTop: spacing.xl,
  },
  error: {
    color: colors.primary,
    fontSize: 12,
    marginBottom: spacing.sm,
  },
  success: {
    color: "#2E7D32",
    fontSize: 12,
    marginBottom: spacing.sm,
  },
});