import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import type { AppScreenProps } from "../types/navigation";
import {
  CARACTERISTICAS_INICIALES,
  FotoParqueadero,
  MAX_FOTOS_PARQUEADERO,
  borrarFotoParqueadero,
  editarParqueadero,
  obtenerParqueadero,
  subirFotoParqueadero,
} from "../services/parking";
import { useAuth } from "../context/AuthContext";
import { Field, PrimaryButton } from "../components/ui";
import { FeaturesPicker } from "../components/ParkingFeatures";
import { colors, radius, spacing } from "../styles/theme";

// Editar parqueadero: el propietario cambia título, ubicación y precio, y administra sus fotos.
// Los textos se envían con "Guardar cambios"; las fotos se suben o borran al instante.
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
  const [fotos, setFotos] = useState<FotoParqueadero[]>([]);
  const [caracteristicas, setCaracteristicas] = useState(CARACTERISTICAS_INICIALES);
  // Texto de avance mientras se sube o borra una foto (null = nada en curso)
  const [progreso, setProgreso] = useState<string | null>(null);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ocupado = progreso !== null;

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
        setFotos(spot.fotos);
        setCaracteristicas(spot.caracteristicas);
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

  // Abre la galería (se pueden elegir varias) y sube las fotos una por una
  const agregarFotos = async () => {
    if (!token) return;

    const disponibles = MAX_FOTOS_PARQUEADERO - fotos.length;

    if (disponibles <= 0) {
      Alert.alert(
        "Límite de fotos",
        `Un parqueadero puede tener máximo ${MAX_FOTOS_PARQUEADERO} fotos.`,
      );
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: disponibles,
      quality: 0.7,
    });

    if (resultado.canceled) return;

    const elegidas = resultado.assets.slice(0, disponibles);

    try {
      for (let i = 0; i < elegidas.length; i++) {
        setProgreso(`Subiendo foto ${i + 1} de ${elegidas.length}...`);

        const actualizado = await subirFotoParqueadero(
          parkingSpotId,
          elegidas[i].uri,
          elegidas[i].mimeType,
          token,
        );

        setFotos(actualizado.fotos);
      }
    } catch (e) {
      Alert.alert(
        "No se pudo subir la foto",
        e instanceof Error ? e.message : "Inténtalo de nuevo.",
      );
    } finally {
      setProgreso(null);
    }
  };

  const borrarFoto = async (foto: FotoParqueadero) => {
    if (!token) return;

    setProgreso("Borrando foto...");

    try {
      const actualizado = await borrarFotoParqueadero(
        parkingSpotId,
        foto.id,
        token,
      );

      setFotos(actualizado.fotos);
    } catch (e) {
      Alert.alert(
        "No se pudo borrar la foto",
        e instanceof Error ? e.message : "Inténtalo de nuevo.",
      );
    } finally {
      setProgreso(null);
    }
  };

  const confirmarBorrado = (foto: FotoParqueadero) => {
    Alert.alert("Borrar foto", "¿Quieres borrar esta foto del parqueadero?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Borrar",
        style: "destructive",
        onPress: () => borrarFoto(foto),
      },
    ]);
  };

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
          caracteristicas,
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

        <Text style={styles.etiquetaCampo}>
          Fotos ({fotos.length}/{MAX_FOTOS_PARQUEADERO})
        </Text>
        <Text style={styles.ayudaFotos}>
          Se guardan al instante. La primera es la portada.
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filaFotos}
        >
          {fotos.map((foto) => (
            <View key={foto.id} style={styles.fotoCaja}>
              <Image source={{ uri: foto.url }} style={styles.fotoImagen} />
              <Pressable
                style={styles.fotoBorrar}
                onPress={() => confirmarBorrado(foto)}
                disabled={ocupado}
              >
                <Feather name="x" size={14} color={colors.white} />
              </Pressable>
            </View>
          ))}

          {fotos.length < MAX_FOTOS_PARQUEADERO && (
            <Pressable
              style={[styles.fotoCaja, styles.fotoAgregar]}
              onPress={agregarFotos}
              disabled={ocupado}
            >
              <Feather name="plus" size={28} color={colors.textLight} />
            </Pressable>
          )}
        </ScrollView>

        {progreso && (
          <View style={styles.progreso}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.progresoTexto}>{progreso}</Text>
          </View>
        )}

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

        <Text style={styles.etiquetaCampo}>Características</Text>
        <FeaturesPicker value={caracteristicas} onChange={setCaracteristicas} />

        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.boton}>
          <PrimaryButton
            label={guardando ? "Guardando..." : "Guardar cambios"}
            onPress={guardar}
            disabled={guardando || ocupado}
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
  ayudaFotos: {
    fontSize: 11,
    color: colors.textLight,
    marginBottom: spacing.sm,
  },
  filaFotos: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  fotoCaja: {
    width: 96,
    height: 96,
    borderRadius: radius.lg,
  },
  fotoImagen: {
    width: 96,
    height: 96,
    borderRadius: radius.lg,
    backgroundColor: colors.imagePlaceholder,
  },
  fotoBorrar: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.black,
  },
  fotoAgregar: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.imagePlaceholder,
  },
  progreso: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  progresoTexto: {
    fontSize: 12,
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