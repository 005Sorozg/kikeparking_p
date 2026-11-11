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
  INITIAL_FEATURES,
  ParkingPhoto,
  MAX_PARKING_PHOTOS,
  Coordinates,
  deleteParkingPhoto,
  editParkingSpot,
  getParkingSpot,
  uploadParkingPhoto,
} from "../services/parking";
import { useAuth } from "../context/AuthContext";
import { Field, PrimaryButton } from "../components/ui";
import { FeaturesPicker } from "../components/ParkingFeatures";
import { LocationPicker } from "../components/LocationPicker";
import { colors, radius, spacing } from "../styles/theme";

// Editar parqueadero: el propietario cambia título, ubicación y precio, y administra sus fotos.
// Los textos se envían con "Guardar cambios"; las fotos se suben o borran al instante.
export function EditParkingScreen({
  navigation,
  route,
}: AppScreenProps<"EditParking">) {
  const { token } = useAuth();
  const { parkingSpotId } = route.params;
  const [title, setTitle] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [address, setAddress] = useState("");
  const [pricePerHour, setPricePerHour] = useState("");
  const [photos, setPhotos] = useState<ParkingPhoto[]>([]);
  const [features, setFeatures] = useState(INITIAL_FEATURES);
  const [location, setLocation] = useState<Coordinates | null>(null);
  // Texto de avance mientras se sube o borra una foto (null = nada en curso)
  const [progress, setProgress] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const busy = progress !== null;

  // Carga los datos actuales para rellenar el formulario
  useEffect(() => {
    let active = true;

    getParkingSpot(parkingSpotId)
      .then((spot) => {
        if (!active) return;
        setTitle(spot.title);
        setNeighborhood(spot.neighborhood);
        setAddress(spot.address);
        setPricePerHour(String(spot.pricePerHour));
        setPhotos(spot.photos);
        setFeatures(spot.features);
        setLocation(spot.location);
      })
      .catch((e) => {
        if (active) {
          setError(
            e instanceof Error ? e.message : "No se pudo cargar el parqueadero.",
          );
        }
      })
      .finally(() => {
        if (active) setLoadingData(false);
      });

    return () => {
      active = false;
    };
  }, [parkingSpotId]);

  // Abre la galería (se pueden elegir varias) y sube las fotos una por una
  const addPhotos = async () => {
    if (!token) return;

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

    const picked = result.assets.slice(0, availableSpots);

    try {
      for (let i = 0; i < picked.length; i++) {
        setProgress(`Subiendo foto ${i + 1} de ${picked.length}...`);

        const updated = await uploadParkingPhoto(
          parkingSpotId,
          picked[i].uri,
          picked[i].mimeType,
          token,
        );

        setPhotos(updated.photos);
      }
    } catch (e) {
      Alert.alert(
        "No se pudo subir la foto",
        e instanceof Error ? e.message : "Inténtalo de nuevo.",
      );
    } finally {
      setProgress(null);
    }
  };

  const deletePhoto = async (photo: ParkingPhoto) => {
    if (!token) return;

    setProgress("Borrando foto...");

    try {
      const updated = await deleteParkingPhoto(
        parkingSpotId,
        photo.id,
        token,
      );

      setPhotos(updated.photos);
    } catch (e) {
      Alert.alert(
        "No se pudo borrar la foto",
        e instanceof Error ? e.message : "Inténtalo de nuevo.",
      );
    } finally {
      setProgress(null);
    }
  };

  const confirmDelete = (photo: ParkingPhoto) => {
    Alert.alert("Borrar foto", "¿Quieres borrar esta foto del parqueadero?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Borrar",
        style: "destructive",
        onPress: () => deletePhoto(photo),
      },
    ]);
  };

  const save = async () => {
    // Mismas reglas que valida el backend, para avisar antes de enviar
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
      setError("Debes iniciar sesión para editar el parqueadero.");
      return;
    }

    setError(null);
    setSaving(true);

    try {
      await editParkingSpot(
        parkingSpotId,
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
      // Al volver, la pantalla del parqueadero se recarga y muestra los cambios
      navigation.goBack();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo guardar los cambios.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loadingData) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Editar parqueadero</Text>
        <Text style={styles.subtitle}>
          Cambia la información de tu espacio. Las reservas que ya tienes no se
          modifican.
        </Text>

        <Text style={styles.fieldLabel}>
          Fotos ({photos.length}/{MAX_PARKING_PHOTOS})
        </Text>
        <Text style={styles.photosHelp}>
          Se guardan al instante. La primera es la portada.
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.photosRow}
        >
          {photos.map((photo) => (
            <View key={photo.id} style={styles.photoBox}>
              <Image source={{ uri: photo.url }} style={styles.photoImage} />
              <Pressable
                style={styles.photoDelete}
                onPress={() => confirmDelete(photo)}
                disabled={busy}
              >
                <Feather name="x" size={14} color={colors.white} />
              </Pressable>
            </View>
          ))}

          {photos.length < MAX_PARKING_PHOTOS && (
            <Pressable
              style={[styles.photoBox, styles.photoAdd]}
              onPress={addPhotos}
              disabled={busy}
            >
              <Feather name="plus" size={28} color={colors.textLight} />
            </Pressable>
          )}
        </ScrollView>

        {progress && (
          <View style={styles.progress}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.progressText}>{progress}</Text>
          </View>
        )}

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

        <View style={styles.button}>
          <PrimaryButton
            label={saving ? "Guardando..." : "Guardar cambios"}
            onPress={save}
            disabled={saving || busy}
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
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
  photoDelete: {
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
    marginTop: spacing.sm,
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