import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { AppScreenProps } from "../types/navigation";
import { publicarParqueadero } from "../services/parking";
import { useAuth } from "../context/AuthContext";
import { Field, ImagePlaceholder, PrimaryButton } from "../components/ui";
import { colors, radius, spacing } from "../styles/theme";

// Agregar parqueadero: formulario del propietario para publicar su espacio.
// Envía título, barrio, dirección y precio por hora a POST /parking-spots.
export function AddParkingScreen({ navigation }: AppScreenProps<"AddParking">) {
  const { token } = useAuth();
  const [titulo, setTitulo] = useState("");
  const [barrio, setBarrio] = useState("");
  const [direccion, setDireccion] = useState("");
  const [precioHora, setPrecioHora] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const publicar = async () => {
    // Mismas reglas que valida el backend, para avisar antes de enviar.
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
      setError("Debes iniciar sesión para publicar un parqueadero.");
      return;
    }

    setError(null);
    setCargando(true);

    try {
      await publicarParqueadero(
        {
          titulo: titulo.trim(),
          barrio: barrio.trim(),
          direccion: direccion.trim(),
          precioHora: precio,
        },
        token,
      );
      // Al volver a Explorar, la lista se recarga y aparece el nuevo parqueadero.
      navigation.goBack();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo publicar el parqueadero.",
      );
    } finally {
      setCargando(false);
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
        <Text style={styles.titulo}>Agrega tu parqueadero</Text>
        <Text style={styles.subtitulo}>
          Cuéntanos sobre tu espacio para que los conductores puedan reservarlo.
        </Text>

        <Text style={styles.etiquetaCampo}>Fotos</Text>
        <View style={styles.foto}>
          <ImagePlaceholder style={styles.fotoImagen} iconSize={40} />
          <Text style={styles.fotoTexto}>Subir fotos estará disponible pronto</Text>
        </View>

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
            label={cargando ? "Publicando..." : "Publicar parqueadero"}
            onPress={publicar}
            disabled={cargando}
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
  foto: {
    alignItems: "center",
    gap: spacing.sm,
  },
  fotoImagen: {
    width: "100%",
    height: 140,
    borderRadius: radius.md,
  },
  fotoTexto: {
    fontSize: 11,
    color: colors.textLight,
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