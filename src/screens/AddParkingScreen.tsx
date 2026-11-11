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
  INITIAL_FEATURES,
  MAX_PARKING_PHOTOS,
  Coordinates,
  publishParkingSpot,
  uploadParkingPhoto,
} from "../services/parking";
import { useAuth } from "../context/AuthContext";
import { Field, PrimaryButton } from "../components/ui";
import { FeaturesPicker } from "../components/ParkingFeatures";
import { LocationPicker } from "../components/LocationPicker";
import { colors, radius, spacing } from "../styles/theme";

// Foto elegida de la galería que todavía no se ha subido
interface LocalPhoto {
  uri: string;
  type?: string;
}

// Agregar parqueadero: formulario del propietario para publicar su espacio.
// Envía título, barrio, dirección y precio a POST /parking-spots y, cuando el
// parqueadero ya existe, sube sus fotos una por una.
export function AddParkingScreen({ navigation }: AppScreenProps<"AddParking">) {
  const { token } = useAuth();
  const [title, setTitle] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [address, setAddress] = useState("");
  const [pricePerHour, setPricePerHour] = useState("");
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [features, setFeatures] = useState(INITIAL_FEATURES);
  const [location, setLocation] = useState<Coordinates | null>(null);
  // Texto de avance mientras se suben las fotos (null = nada en curso)
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Abre la galería y deja varias fotos listas para subir al publicar
  const pickPhotos = async () => {
    const availableSpots = MAX_PARKING_PHOTOS - photos.length;

    if (availableSpots <= 0) {
      Alert.alert(
        "Límite de fotos",
        `Un parqueadero puede tener máximo ${MAX_PARKING_PHOTOS} fotos.`,
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: availableSpots,
      quality: 0.7,
    });

    if (result.canceled) return;

    const next = result.assets
      .slice(0, availableSpots)
      .map((photo) => ({ uri: photo.uri, type: photo.mimeType }));

    setPhotos((current) => [...current, ...next]);
  };

  const removePhoto = (index: number) => {
    setPhotos((current) => current.filter((_, i) => i !== index));
  };

  const publish = async () => {
    // Mismas reglas que valida el backend, para avisar antes de enviar.
    const price = Number(pricePerHour.replace(/\D/g, ""));
    if (title.trim().length < 3) {
      setError("El título debe tener al menos 3 caracteres.");
      return;
    }
    if (neighborhood.trim().length < 2) {
      setError("Escribe el barrio.");
      return;
    }
    if (address.trim().length < 3) {
      setError("Escribe la dirección.");
      return;
    }
    if (!Number.isInteger(price) || price <= 0) {
      setError("El precio por hora debe ser un número mayor que 0.");
      return;
    }
    if (!token) {
      setError("Debes iniciar sesión para publicar un parqueadero.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const created = await publishParkingSpot(
        {
          title: title.trim(),
          neighborhood: neighborhood.trim(),
          address: address.trim(),
          pricePerHour: price,
          features,
          location,
        },
        token,
      );

      // El parqueadero ya existe: ahora se suben sus fotos, una por una
      let failed = 0;

      for (let i = 0; i < photos.length; i++) {
        setProgress(`Subiendo foto ${i + 1} de ${photos.length}...`);

        try {
          await uploadParkingPhoto(created.id, photos[i].uri, photos[i].type, token);
        } catch {
          failed++;
        }
      }

      if (failed > 0) {
        // El parqueadero quedó publicado; solo faltan algunas fotos
        Alert.alert(
          "Parqueadero publicado",
          `No se pudieron subir ${failed} de ${photos.length} fotos. Puedes agregarlas desde Mis parqueaderos, en "Editar información".`,
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
      setLoading(false);
      setProgress(null);
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
        <Text style={styles.title}>Agrega tu parqueadero</Text>
        <Text style={styles.subtitle}>
          Cuéntanos sobre tu espacio para que los conductores puedan reservarlo.
        </Text>

        <Text style={styles.fieldLabel}>
          Fotos ({photos.length}/{MAX_PARKING_PHOTOS})
        </Text>
        <Text style={styles.photosHelp}>
          Se suben al publicar. La primera es la portada.
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.photosRow}
        >
          {photos.map((photo, index) => (
            <View key={photo.uri} style={styles.photoBox}>
              <Image source={{ uri: photo.uri }} style={styles.photoImage} />
              <Pressable
                style={styles.photoRemove}
                onPress={() => removePhoto(index)}
                disabled={loading}
              >
                <Feather name="x" size={14} color={colors.white} />
              </Pressable>
            </View>
          ))}

          {photos.length < MAX_PARKING_PHOTOS && (
            <Pressable
              style={[styles.photoBox, styles.photoAdd]}
              onPress={pickPhotos}
              disabled={loading}
            >
              <Feather name="plus" size={28} color={colors.textLight} />
            </Pressable>
          )}
        </ScrollView>

        <Text style={styles.fieldLabel}>Título</Text>
        <Field
          value={title}
          onChangeText={setTitle}
          placeholder="Ej: Garaje techado con vigilancia"
          autoCapitalize="sentences"
        />

        <Text style={styles.fieldLabel}>Ubicación</Text>
        {/* Al confirmar el punto, se llenan la dirección y el barrio (se pueden corregir) */}
        <LocationPicker
          value={location}
          onChange={(newPassword, found) => {
            setLocation(newPassword);
            if (found.neighborhood) setNeighborhood(found.neighborhood);
            if (found.address) setAddress(found.address);
          }}
        />
        <View style={styles.locationSpacing} />
        <Field
          value={neighborhood}
          onChangeText={setNeighborhood}
          placeholder="Barrio"
          autoCapitalize="words"
        />
        <Field
          value={address}
          onChangeText={setAddress}
          placeholder="Dirección (Ej: Cra. 76 #44-20)"
          autoCapitalize="sentences"
        />

        <Text style={styles.fieldLabel}>Precio por hora (COP)</Text>
        <Field
          value={pricePerHour}
          onChangeText={setPricePerHour}
          placeholder="Ej: 5000"
          keyboardType="number-pad"
        />

        <Text style={styles.fieldLabel}>Características</Text>
        <FeaturesPicker value={features} onChange={setFeatures} />

        {error && <Text style={styles.error}>{error}</Text>}

        {progress && (
          <View style={styles.progress}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.progressText}>{progress}</Text>
          </View>
        )}

        <View style={styles.button}>
          <PrimaryButton
            label={loading ? "Publicando..." : "Publicar parqueadero"}
            onPress={publish}
            disabled={loading}
          />
        </View>
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
  },
  subtitle: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  locationSpacing: {
    height: spacing.sm,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  photosHelp: {
    fontSize: 11,
    color: colors.textLight,
    marginBottom: spacing.sm,
  },
  photosRow: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  photoBox: {
    width: 96,
    height: 96,
    borderRadius: radius.lg,
  },
  photoImage: {
    width: 96,
    height: 96,
    borderRadius: radius.lg,
    backgroundColor: colors.imagePlaceholder,
  },
  photoRemove: {
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
  photoAdd: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.imagePlaceholder,
  },
  progress: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  progressText: {
    fontSize: 12,
    color: colors.textLight,
  },
  error: {
    color: colors.primary,
    fontSize: 12,
    marginTop: spacing.md,
  },
  button: {
    marginTop: spacing.lg,
  },
});