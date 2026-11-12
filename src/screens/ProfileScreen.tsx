import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CommonActions, useFocusEffect } from "@react-navigation/native";
import type { MainTabScreenProps } from "../types/navigation";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AvatarPlaceholder,
  CircleButton,
  ImagePlaceholder,
} from "../components/ui";
import { colors, radius, shadow, spacing } from "../styles/theme";
import { useAuth } from "../context/AuthContext";
import * as ImagePicker from "expo-image-picker";
import { removeAvatar, uploadAvatar } from "../services/profile";
import {
  calculateStats,
  getMyBookings,
  getReceivedBookings,
} from "../services/bookings";
import { MyRating, getMyRating } from "../services/reviews";

const OPTIONS: {
  icon: "settings" | "help-circle";
  text: string;
  screen?: "AccountSettings" | "Help";
}[] = [
  {
    icon: "settings",
    text: "Configuración de la cuenta",
    screen: "AccountSettings",
  },
  { icon: "help-circle", text: "Obtén ayuda", screen: "Help" },
];

export function ProfileScreen({ navigation }: MainTabScreenProps<"Profile">) {
  const insets = useSafeAreaInsets();
  const {
    user,
    token,
    updateUser,
    logout: clearSession,
  } = useAuth();
  const isOwner = user?.role === "propietario";
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  // Reservas confirmadas del usuario (null = cargando o no disponible)
  const [totalBookings, setTotalBookings] = useState<number | null>(null);
  // Calificación promedio (null = cargando o no disponible)
  const [rating, setRating] = useState<MyRating | null>(null);

  // El conductor cuenta las reservas que hizo; el propietario, las que recibió.
  // Se recalcula cada vez que se vuelve a esta pestaña (por ejemplo, tras reservar o cancelar).
  useFocusEffect(
    useCallback(() => {
      if (!token) return;

      let active = true;
      const request = isOwner ? getReceivedBookings : getMyBookings;

      request(token)
        .then((data) => {
          if (active) setTotalBookings(calculateStats(data).total);
        })
        .catch(() => {
          // Si falla, se muestra un guion en lugar de un número inventado
          if (active) setTotalBookings(null);
        });

      getMyRating(token)
        .then((result) => {
          if (active) setRating(result);
        })
        .catch(() => {
          if (active) setRating(null);
        });

      return () => {
        active = false;
      };
    }, [token, isOwner]),
  );

  // Abre la galería, deja recortar en cuadrado y sube la foto elegida
  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled || !token) return;

    const photo = result.assets[0];
    setUploadingPhoto(true);

    try {
      const updated = await uploadAvatar(photo.uri, photo.mimeType, token);
      await updateUser(updated);
    } catch (e) {
      Alert.alert(
        "No se pudo subir la foto",
        e instanceof Error ? e.message : "Inténtalo de nuevo.",
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removePhoto = async () => {
    if (!token) return;

    setUploadingPhoto(true);

    try {
      const updated = await removeAvatar(token);
      await updateUser(updated);
    } catch (e) {
      Alert.alert(
        "No se pudo quitar la foto",
        e instanceof Error ? e.message : "Inténtalo de nuevo.",
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Al tocar el avatar: elegir una foto nueva o quitar la actual
  const changePhoto = () => {
    Alert.alert("Foto de perfil", undefined, [
      { text: "Elegir de la galería", onPress: pickPhoto },
      ...(user?.avatarUrl
        ? [
            {
              text: "Quitar foto",
              style: "destructive" as const,
              onPress: removePhoto,
            },
          ]
        : []),
      { text: "Cancelar", style: "cancel" as const },
    ]);
  };

  const logout = () => {
    // Primero se borra la sesión (usuario y token) y luego se vuelve al login.
    clearSession();
    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: "Login" }] }),
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.actions}>
        <CircleButton icon="bell" />
      </View>
      <Text style={styles.title}>Perfil</Text>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, styles.profileCard]}>
          <View style={styles.profile}>
            <Pressable onPress={changePhoto} disabled={uploadingPhoto}>
              <AvatarPlaceholder
                size={84}
                source={
                  user?.avatarUrl ? { uri: user.avatarUrl } : undefined
                }
              />
              <View style={styles.camera}>
                {uploadingPhoto ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Feather name="camera" size={14} color={colors.white} />
                )}
              </View>
            </Pressable>
            <Text style={styles.name}>{user?.name ?? "Invitado"}</Text>
            <Text style={styles.location}>
              {isOwner ? "Propietario" : "Conductor"}
            </Text>
          </View>

          <View style={styles.stats}>
            <Text style={styles.statValue}>{totalBookings ?? "-"}</Text>
            <Text style={styles.statLabel}>
              {isOwner ? "Reservas recibidas" : "Reservas"}
            </Text>

            <View style={styles.statsSeparator} />

            {/* Conductor: lo que le dan los propietarios. Propietario: promedio de sus parqueaderos */}
            {rating && rating.reviewCount > 0 ? (
              <View style={styles.ratingRow}>
                <Text style={styles.statValue}>
                  {rating.average.toFixed(1)}
                </Text>
                <Ionicons name="star" size={22} color={colors.text} />
              </View>
            ) : (
              <Text style={styles.statValue}>-</Text>
            )}
            <Text style={styles.statLabel}>
              {rating && rating.reviewCount === 0
                ? "Sin calificaciones"
                : "Calificación"}
            </Text>
          </View>
        </View>

        <View style={styles.row}>
          <Pressable
            style={[styles.card, styles.cardMini]}
            onPress={() => navigation.navigate("MyBookings")}
          >
            <ImagePlaceholder
              style={{ width: 64, height: 64, borderRadius: radius.sm }}
              iconSize={26}
              source={require("../../assets/images/laureles-2026.jpeg")}
            />
            <Text style={styles.miniText}>Reservas anteriores</Text>
          </Pressable>
        </View>

        {isOwner && (
          <Pressable
            style={[styles.card, styles.host]}
            onPress={() => navigation.navigate("AddParking")}
          >
            <Feather name="plus-circle" size={26} color={colors.primary} />
            <View style={styles.hostTexts}>
              <Text style={styles.hostTitle}>Publica tu parqueadero</Text>
              <Text style={styles.hostDescription}>
                Renta tu espacio y genera ingresos.
              </Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.textLight} />
          </Pressable>
        )}

        <View style={styles.options}>
          {OPTIONS.map((o) => (
            <Pressable
              key={o.text}
              style={styles.option}
              onPress={() => o.screen && navigation.navigate(o.screen)}
            >
              <Feather name={o.icon} size={18} color={colors.text} />
              <Text style={styles.optionText}>{o.text}</Text>
              <Feather name="chevron-right" size={16} color={colors.textLight} />
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.option} onPress={logout}>
          <Feather name="log-out" size={18} color={colors.primary} />
          <Text style={[styles.optionText, styles.optionLogout]}>Cerrar sesión</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    paddingHorizontal: 24,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    ...shadow,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: spacing.md,
  },
  profile: {
    flex: 1,
    alignItems: "center",
  },
  camera: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.black,
    borderWidth: 2,
    borderColor: colors.white,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  location: {
    fontSize: 10,
    color: colors.textLight,
    marginTop: 2,
  },
  stats: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text,
    textAlign: "center",
  },
  statsSeparator: {
    width: 40,
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.sm,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  cardMini: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  miniText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.text,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  host: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  hostTexts: {
    flex: 1,
  },
  hostTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
  },
  hostDescription: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 3,
  },
  options: {
    marginTop: spacing.lg,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: 12,
  },
  optionText: {
    flex: 1,
    fontSize: 12,
    color: colors.text,
  },
  optionLogout: {
    color: colors.primary,
    fontWeight: "600",
  },
});