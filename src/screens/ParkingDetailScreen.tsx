import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { AppScreenProps } from "../types/navigation";
import {
  ParkingSpot,
  formatPrice,
  getParkingSpot,
} from "../services/parking";
import { ImagePlaceholder, PrimaryButton } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { ReviewItem } from "../components/ReviewItem";
import { FeatureList } from "../components/ParkingFeatures";
import { Review, getReviews } from "../services/reviews";
import { useFavorites } from "../context/FavoritesContext";
import { openConversation } from "../services/messages";
import { colors, radius, spacing } from "../styles/theme";

// Detalle de un parqueadero: se pide al backend por su id.
export function ParkingDetailScreen({
  route,
  navigation,
}: AppScreenProps<"ParkingDetail">) {
  const [spot, setSpot] = useState<ParkingSpot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activePhoto, setActivePhoto] = useState(0);
  const { user, token } = useAuth();
  const [openingChat, setOpeningChat] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const { isFavorite, toggleFavorite } = useFavorites();
  // Reseñas de los conductores (se cargan aparte: si fallan, el detalle igual se muestra)
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    let active = true;

    getReviews(route.params.parkingSpotId)
      .then((list) => {
        if (active) setReviews(list);
      })
      .catch(() => {});

    getParkingSpot(route.params.parkingSpotId)
      .then((result) => {
        if (active) setSpot(result);
      })
      .catch((e) => {
        if (active) {
          setError(
            e instanceof Error ? e.message : "No se pudo cargar el parqueadero.",
          );
        }
      });

    return () => {
      active = false;
    };
  }, [route.params.parkingSpotId]);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>{error}</Text>
      </View>
    );
  }

  if (!spot) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  // Abre el chat con el dueño (o el que ya existía) y lleva a la conversación.
  const contact = async () => {
    if (!token) return;

    setOpeningChat(true);
    setChatError(null);
    try {
      const chat = await openConversation(spot.id, token);
      navigation.navigate("Chat", {
        conversationId: chat.id,
        title: chat.contact.name,
      });
    } catch (e) {
      setChatError(e instanceof Error ? e.message : "No se pudo abrir el chat.");
    } finally {
      setOpeningChat(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <View style={styles.photoContainer}>
        <ImagePlaceholder
          style={styles.photo}
          iconSize={96}
          source={
            spot.photos[activePhoto] ? { uri: spot.photos[activePhoto].url } : undefined
          }
        />
        {/* Solo los conductores guardan favoritos */}
        {user?.role === "conductor" && (
          <Pressable
            style={styles.heart}
            hitSlop={8}
            onPress={() => toggleFavorite(spot)}
          >
            <Ionicons
              name={isFavorite(spot.id) ? "heart" : "heart-outline"}
              size={18}
              color={isFavorite(spot.id) ? colors.primary : "#B5B5B5"}
            />
          </Pressable>
        )}
      </View>

      {spot.photos.length > 1 && (
        <View style={styles.thumbnails}>
          {spot.photos.map((photo, index) => (
            <Pressable key={photo.id} onPress={() => setActivePhoto(index)}>
              <Image
                source={{ uri: photo.url }}
                style={[
                  styles.thumbnail,
                  index === activePhoto && styles.thumbnailActive,
                ]}
              />
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.rowTitle}>
        <Text style={styles.title}>{spot.title}</Text>
        <View style={styles.rating}>
          <Ionicons name="star" size={14} color={colors.black} />
          <Text style={styles.ratingText}>
            {spot.reviewCount > 0 ? spot.rating.toFixed(1) : "Nuevo"}
          </Text>
        </View>
      </View>

      <Text style={styles.detail}>
        {spot.neighborhood} · {spot.address}
      </Text>

      {/* Abre Google Maps con la ruta hasta el parqueadero */}
      {spot.location && (
        <Pressable
          style={styles.directions}
          hitSlop={8}
          onPress={() =>
            Linking.openURL(
              `https://www.google.com/maps/dir/?api=1&destination=${spot.location!.lat},${spot.location!.lng}`,
            )
          }
        >
          <Ionicons name="navigate-outline" size={14} color={colors.text} />
          <Text style={styles.directionsText}>Cómo llegar</Text>
        </Pressable>
      )}

      <Text style={styles.price}>
        {formatPrice(spot.pricePerHour)}
        <Text style={styles.priceUnit}> / hora</Text>
      </Text>
      <Text style={[styles.status, !spot.available && styles.statusBusy]}>
        {spot.available ? "Disponible" : "No disponible por ahora"}
      </Text>

      {/* Lo que marcó el propietario: vehículos, techado, vigilancia... */}
      <Text style={styles.offersSection}>Lo que ofrece</Text>
      <FeatureList features={spot.features} />

      <View style={styles.button}>
        <PrimaryButton
          label="Reservar"
          onPress={() =>
            navigation.navigate("Booking", { parkingSpotId: spot.id })
          }
          disabled={!spot.available}
        />
        {/* Solo los conductores escriben al propietario */}
        {user?.role === "conductor" && (
          <Pressable
            style={styles.contact}
            onPress={contact}
            disabled={openingChat}
          >
            <Ionicons name="chatbubble-outline" size={16} color={colors.text} />
            <Text style={styles.contactText}>
              {openingChat ? "Abriendo chat..." : "Contactar al propietario"}
            </Text>
          </Pressable>
        )}
        {chatError && <Text style={styles.error}>{chatError}</Text>}
      </View>
      {/* Lo que dijeron los conductores que ya lo usaron */}
      <Text style={styles.reviewsSection}>
        {reviews.length > 0 ? "Reseñas" : "Aún no tiene reseñas"}
      </Text>
      {reviews.map((r) => (
        <ReviewItem key={r.id} review={r} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 18,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  empty: {
    color: colors.textLight,
  },
  photoContainer: {
    width: 280,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  photo: {
    width: 280,
    height: 280,
    borderRadius: radius.lg,
  },
  heart: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbnails: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    opacity: 0.6,
  },
  thumbnailActive: {
    opacity: 1,
    borderWidth: 2,
    borderColor: colors.black,
  },
  rowTitle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  rating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: spacing.sm,
  },
  ratingText: {
    fontSize: 12,
    color: colors.text,
  },
  detail: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing.md,
  },
  priceUnit: {
    fontSize: 12,
    fontWeight: "400",
  },
  status: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2E7D32",
    marginTop: spacing.xs,
  },
  statusBusy: {
    color: colors.primary,
  },
  button: {
    marginTop: spacing.lg,
  },
  contact: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.sm,
    // Mismo tamaño que el botón principal, pero con borde en vez de relleno
    height: 42,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.text,
  },
  contactText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.text,
  },
  error: {
    fontSize: 12,
    color: colors.primary,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  directions: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    marginTop: spacing.xs,
  },
  directionsText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
    textDecorationLine: "underline",
  },
  offersSection: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  reviewsSection: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing.xl,
  },
  
});