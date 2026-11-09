import React, { useState } from "react";
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
  MAX_FOTOS_PARQUEADERO,
  publicarParqueadero,
  subirFotoParqueadero,
} from "../services/parking";
import { useAuth } from "../context/AuthContext";
import { Field, PrimaryButton } from "../components/ui";
import { FeaturesPicker } from "../components/ParkingFeatures";
import { colors, radius, spacing } from "../styles/theme";

// Foto elegida de la galería que todavía no se ha subido
interface FotoLocal {
  uri: string;
  tipo?: string;
}

// Agregar parqueadero: formulario del propietario para publicar su espacio.
// Envía título, barrio, dirección y precio a POST /parking-spots y, cuando el
// parqueadero ya existe, sube sus fotos una por una.
export function AddParkingScreen({ navigation }: AppScreenProps<"AddParking">) {
  const { token } = useAuth();
  const [titulo, setTitulo] = useState("");
  const [barrio, setBarrio] = useState("");
  const [direccion, setDireccion] = useState("");
  const [precioHora, setPrecioHora] = useState("");
  const [fotos, setFotos] = useState<FotoLocal[]>([]);
  const [caracteristicas, setCaracteristicas] = useState(CARACTERISTICAS_INICIALES);
  // Texto de avance mientras se suben las fotos (null = nada en curso)
  const [progreso, setProgreso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  // Abre la galería y deja varias fotos listas para subir al publicar
  const elegirFotos = async () => {
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

    const nuevas = resultado.assets
      .slice(0, disponibles)
      .map((foto) => ({ uri: foto.uri, tipo: foto.mimeType }));

    setFotos((actuales) => [...actuales, ...nuevas]);
  };

  const quitarFoto = (indice: number) => {
    setFotos((actuales) => actuales.filter((_, i) => i !== indice));
  };

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
      const nuevo = await publicarParqueadero(
        {
          titulo: titulo.trim(),
          barrio: barrio.trim(),
          direccion: direccion.trim(),
          precioHora: precio,
          caracteristicas,
        },
        token,
      );

      // El parqueadero ya existe: ahora se suben sus fotos, una por una
      let fallidas = 0;

      for (let i = 0; i < fotos.length; i++) {
        setProgreso(`Subiendo foto ${i + 1} de ${fotos.length}...`);

        try {
          await subirFotoParqueadero(nuevo.id, fotos[i].uri, fotos[i].tipo, token);
        } catch {
          fallidas++;
        }
      }

      if (fallidas > 0) {
        // El parqueadero quedó publicado; solo faltan algunas fotos
        Alert.alert(
          "Parqueadero publicado",
          `No se pudieron subir ${fallidas} de ${fotos.length} fotos. Puedes agregarlas desde Mis parqueaderos, en "Editar información".`,
          [{ text: "Entendido", onPress: () => navigation.goBack() }],
        );
      } else {
        // Al volver a Explorar, la lista se recarga y aparece el nuevo parqueadero.
        navigation.goBack();
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo publicar el parqueadero.",
      );
    } finally {
      setCargando(false);
      setProgreso(null);
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

        <Text style={styles.etiquetaCampo}>
          Fotos ({fotos.length}/{MAX_FOTOS_PARQUEADERO})
        </Text>
        <Text style={styles.ayudaFotos}>
          Se suben al publicar. La primera es la portada.
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filaFotos}
        >
          {fotos.map((foto, indice) => (
            <View key={foto.uri} style={styles.fotoCaja}>
              <Image source={{ uri: foto.uri }} style={styles.fotoImagen} />
              <Pressable
                style={styles.fotoQuitar}
                onPress={() => quitarFoto(indice)}
                disabled={cargando}
              >
                <Feather name="x" size={14} color={colors.white} />
              </Pressable>
            </View>
          ))}

          {fotos.length < MAX_FOTOS_PARQUEADERO && (
            <Pressable
              style={[styles.fotoCaja, styles.fotoAgregar]}
              onPress={elegirFotos}
              disabled={cargando}
            >
              <Feather name="plus" size={28} color={colors.textLight} />
            </Pressable>
          )}
        </ScrollView>

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

        {progreso && (
          <View style={styles.progreso}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.progresoTexto}>{progreso}</Text>
          </View>
        )}

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
  fotoQuitar: {
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
    marginTop: spacing.md,
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