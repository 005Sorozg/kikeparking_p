import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { AppScreenProps } from "../types/navigation";
import { editarParqueadero, obtenerParqueadero } from "../services/parking";
import { useAuth } from "../context/AuthContext";
import { Field, PrimaryButton } from "../components/ui";
import { colors, spacing } from "../styles/theme";

// Editar parqueadero: el propietario cambia título, ubicación y precio.
// Los campos arrancan con los datos actuales y se envían a PATCH /parking-spots/:id.
export function EditParkingScreen({
  navigation,
  route,
}: AppScreenProps<"EditParking">) {
  const { token } = useAuth();
  const { parkingSpotId } = route.params;
  const [titulo, setTitulo] = useState("");
  const [barrio, setBarrio] = useState("");
  const [direccion, setDireccion] = useState("");
  const [precioHora, setPrecioHora] = useState("");
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carga los datos actuales para rellenar el formulario
  useEffect(() => {
    let activo = true;

    obtenerParqueadero(parkingSpotId)
      .then((spot) => {
        if (!activo) return;
        setTitulo(spot.titulo);
        setBarrio(spot.barrio);
        setDireccion(spot.direccion);
        setPrecioHora(String(spot.precioHora));
      })
      .catch((e) => {
        if (activo) {
          setError(
            e instanceof Error ? e.message : "No se pudo cargar el parqueadero.",
          );
        }
      })
      .finally(() => {
        if (activo) setCargandoDatos(false);
      });

    return () => {
      activo = false;
    };
  }, [parkingSpotId]);

  const guardar = async () => {
    // Mismas reglas que valida el backend, para avisar antes de enviar
    const precio = Number(precioHora.replace(/\D/g, ""));
    if (titulo.trim().length < 3) {
      setError("El título debe tener al menos 3 caracteres.");
      return;
    }
    if (barrio.trim().length < 2) {
      setError("Escribe el barrio.");
      return;
    }
    if (direccion.trim().length < 3) {
      setError("Escribe la dirección.");
      return;
    }
    if (!Number.isInteger(precio) || precio <= 0) {
      setError("El precio por hora debe ser un número mayor que 0.");
      return;
    }
    if (!token) {
      setError("Debes iniciar sesión para editar el parqueadero.");
      return;
    }

    setError(null);
    setGuardando(true);

    try {
      await editarParqueadero(
        parkingSpotId,
        {
          titulo: titulo.trim(),
          barrio: barrio.trim(),
          direccion: direccion.trim(),
          precioHora: precio,
        },
        token,
      );
      // Al volver, la pantalla del parqueadero se recarga y muestra los cambios
      navigation.goBack();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo guardar los cambios.",
      );
    } finally {
      setGuardando(false);
    }
  };

  if (cargandoDatos) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.contenedor}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.contenido}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.titulo}>Editar parqueadero</Text>
        <Text style={styles.subtitulo}>
          Cambia la información de tu espacio. Las reservas que ya tienes no se
          modifican.
        </Text>

        <Text style={styles.etiquetaCampo}>Título</Text>
        <Field
          value={titulo}
          onChangeText={setTitulo}
          placeholder="Ej: Garaje techado con vigilancia"
          autoCapitalize="sentences"
        />

        <Text style={styles.etiquetaCampo}>Ubicación</Text>
        <Field
          value={barrio}
          onChangeText={setBarrio}
          placeholder="Barrio"
          autoCapitalize="words"
        />
        <Field
          value={direccion}
          onChangeText={setDireccion}
          placeholder="Dirección (Ej: Cra. 76 #44-20)"
          autoCapitalize="sentences"
        />

        <Text style={styles.etiquetaCampo}>Precio por hora (COP)</Text>
        <Field
          value={precioHora}
          onChangeText={setPrecioHora}
          placeholder="Ej: 5000"
          keyboardType="number-pad"
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.boton}>
          <PrimaryButton
            label={guardando ? "Guardando..." : "Guardar cambios"}
            onPress={guardar}
            disabled={guardando}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  },
  subtitulo: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  etiquetaCampo: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  error: {
    color: colors.primary,
    fontSize: 12,
    marginTop: spacing.md,
  },
  boton: {
    marginTop: spacing.lg,
  },
});