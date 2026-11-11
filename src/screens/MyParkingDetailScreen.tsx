import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  Pressable,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import type { AppScreenProps } from "../types/navigation";
import {
  ParkingSpot,
  changeAvailability,
  formatPrice,
  getParkingSpot,
} from "../services/parking";
import {
  Booking,
  calculateStats,
  isUpcoming,
  formatRange,
  getReceivedBookings,
  timeLeft,
} from "../services/bookings";
import { BookingPhaseTag } from "../components/BookingPhaseTag";
import { ReviewModal } from "../components/ReviewModal";
import { ReviewItem } from "../components/ReviewItem";
import { Stars } from "../components/Stars";
import { Review, getReviews } from "../services/reviews";
import { useAuth } from "../context/AuthContext";
import { ImagePlaceholder, PrimaryButton } from "../components/ui";
import { colors, radius, spacing } from "../styles/theme";

// Vista del propietario de uno de sus parqueaderos: estadísticas y reservas.
export function MyParkingDetailScreen({
  route,
  navigation,
}: AppScreenProps<"MyParkingDetail">) {
  const { token } = useAuth();
  const { parkingSpotId } = route.params;
  const [spot, setSpot] = useState<ParkingSpot | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [changing, setChanging] = useState(false);
  const [pauseError, setPauseError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  // Reserva cuyo conductor se está calificando
  const [reviewingBooking, setReviewingBooking] = useState<Booking | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!token) {
        setError("Debes iniciar sesión.");
        return;
      }

      let active = true;

      Promise.all([
        getParkingSpot(parkingSpotId),
        getReceivedBookings(token, parkingSpotId),
        getReviews(parkingSpotId),
      ])
        .then(([result, list, reviewList]) => {
          if (!active) return;
          setSpot(result);
          setBookings(list);
          setReviews(reviewList);
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
    }, [token, parkingSpotId]),
  );

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

// Pausar / reactivar: el interruptor cambia "available" en el backend.
  const toggleAvailable = async (available: boolean) => {
    if (!token) return;

    setChanging(true);
    setPauseError(null);
    try {
      setSpot(await changeAvailability(spot.id, available, token));
    } catch (e) {
      setPauseError(
        e instanceof Error ? e.message : "No se pudo cambiar la disponibilidad.",
      );
    } finally {
      setChanging(false);
    }
  };

  const stats = calculateStats(bookings);
  const upcomingBookings = bookings
    .filter(isUpcoming)
    .sort((a, b) => a.start.getTime() - b.start.getTime());
    // Quién está usando el parqueadero ahora mismo
  const inProgress = bookings.filter((r) => r.phase === "in_progress");
  // Historial: completadas y canceladas, la más reciente primero
  const past = bookings
    .filter((r) => r.phase === "completed" || r.phase === "cancelled")
    .sort((a, b) => b.start.getTime() - a.start.getTime());

  const CARDS = [
    { value: String(stats.total), label: "Reservas" },
    { value: String(stats.upcomingBookings), label: "Próximas" },
    { value: String(stats.hours), label: "Horas reservadas" },
    { value: String(stats.cancelledBookings), label: "Canceladas" },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <ImagePlaceholder style={styles.photo} iconSize={30} source={spot.image} />
        <View style={styles.headerTexts}>
          <Text style={styles.title}>{spot.title}</Text>
          <Text style={styles.detail}>
            {spot.neighborhood} · {spot.address}
          </Text>
          <Text style={styles.price}>
            {formatPrice(spot.pricePerHour)}
            <Text style={styles.priceUnit}> / hora</Text>
          </Text>
          <View style={styles.rating}>
            <Ionicons name="star" size={12} color={colors.text} />
            <Text style={styles.ratingText}>
              {spot.reviewCount > 0 ? spot.rating.toFixed(1) : "Sin calificaciones todavía"}
            </Text>
          </View>
          <Text style={[styles.status, !spot.available && styles.statusPaused]}>
            {spot.available ? "Disponible" : "Pausado"}
          </Text>
        </View>
      </View>

      <View style={styles.editButton}>
        <PrimaryButton
          label="Editar información"
          onPress={() =>
            navigation.navigate("EditParking", { parkingSpotId: spot.id })
          }
        />
      </View>

      <View style={styles.pause}>
        <View style={styles.pauseTexts}>
          <Text style={styles.pauseTitle}>Recibir reservas</Text>
          <Text style={styles.pauseDescription}>
            {spot.available
              ? "Los conductores pueden reservar este parqueadero."
              : "Pausado: no recibe reservas nuevas. Las que ya tenías se mantienen."}
          </Text>
        </View>
        <Switch
          value={spot.available}
          onValueChange={toggleAvailable}
          disabled={changing}
          trackColor={{ false: colors.borderLight, true: colors.primary }}
          thumbColor={colors.white}
          // En web el círculo activo sale verde por defecto; así queda blanco también ahí.
          {...({ activeThumbColor: colors.white } as object)}
        />
      </View>
      {pauseError && <Text style={styles.error}>{pauseError}</Text>}

      <View style={styles.earnings}>
        <Text style={styles.earningsLabel}>Ingresos</Text>
        <Text style={styles.earningsValue}>{formatPrice(stats.earnings)}</Text>
        <Text style={styles.earningsNote}>
          Reservas confirmadas, incluidas las próximas
        </Text>
      </View>

      <View style={styles.cards}>
        {CARDS.map((t) => (
          <View key={t.label} style={styles.card}>
            <Text style={styles.cardValue}>{t.value}</Text>
            <Text style={styles.cardLabel}>{t.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.section}>En este momento</Text>
      {inProgress.length === 0 && (
        <Text style={styles.empty}>Nadie está usando el parqueadero ahora.</Text>
      )}
      {inProgress.map((r) => (
        <BookingRow key={r.id} booking={r} onRate={setReviewingBooking} />
      ))}

      <Text style={styles.section}>Próximas reservas</Text>
      {upcomingBookings.length === 0 && (
        <Text style={styles.empty}>No hay reservas próximas.</Text>
      )}
      {upcomingBookings.map((r) => (
        <BookingRow key={r.id} booking={r} onRate={setReviewingBooking} />
      ))}

      <Text style={styles.section}>Historial</Text>
      {past.length === 0 && (
        <Text style={styles.empty}>Todavía no hay reservas anteriores.</Text>
      )}
      {past.map((r) => (
        <BookingRow key={r.id} booking={r} onRate={setReviewingBooking} />
      ))}
      <Text style={styles.section}>Reseñas de los conductores</Text>
      {reviews.length === 0 && (
        <Text style={styles.empty}>Todavía nadie ha calificado este parqueadero.</Text>
      )}
      {reviews.map((r) => (
        <ReviewItem key={r.id} review={r} />
      ))}

      <ReviewModal
        bookingId={reviewingBooking?.id ?? null}
        title={`¿Cómo fue ${reviewingBooking?.driver.name ?? ""} como conductor?`}
        onClose={() => setReviewingBooking(null)}
        onRated={(id, stars) => {
          setBookings((current) =>
            current.map((r) => (r.id === id ? { ...r, myRating: stars } : r)),
          );
          setReviewingBooking(null);
        }}
      />
    </ScrollView>
  );
}

// Una reserva: quién, cuándo, vehículo y valor.
  // Una reserva: quién (con su calificación), cuándo, vehículo y valor.
  function BookingRow({
    booking: r,
    onRate: onRate,
  }: {
    booking: Booking;
    onRate: (booking: Booking) => void;
  }) {
  const isCancelled = r.status === "cancelled";
  return (
    <View style={styles.row}>
      <View style={styles.avatar}>
        <Text style={styles.avatarLetter}>
          {r.driver.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.rowTexts}>
          <Text style={styles.name}>
            {r.driver.name}
            {r.driver.reviewCount > 0 && (
              <Text style={styles.detail}>
                {"  "}★ {r.driver.rating.toFixed(1)}
              </Text>
            )}
          </Text>
        <Text style={styles.detail}>{formatRange(r.start, r.end)}</Text>
        <View style={styles.vehicle}>
          <Feather
            name={r.vehicle === "carro" ? "truck" : "navigation"}
            size={11}
            color={colors.textLight}
          />
          <Text style={styles.detail}>
            {r.vehicle === "carro" ? "Carro" : "Moto"} · {r.hours}{" "}
            {r.hours === 1 ? "hora" : "horas"}
          </Text>
        </View>
        <BookingPhaseTag phase={r.phase} />
        {r.phase === "in_progress" && (
          <Text style={styles.remaining}>Sale en {timeLeft(r.end)}</Text>
        )}
      </View>
      {r.phase === "completed" && r.myRating !== null && (
        <View style={styles.rated}>
          <Text style={styles.detail}>Calificaste</Text>
          <Stars value={r.myRating} size={11} />
        </View>
      )}
      {r.phase === "completed" && r.myRating === null && (
        <Pressable onPress={() => onRate(r)}>
          <Text style={styles.action}>Calificar conductor</Text>
        </Pressable>
      )}
      <Text style={[styles.value, isCancelled && styles.valueStrikethrough]}>
        {formatPrice(r.total)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 18,
    paddingBottom: spacing.xl,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    gap: 14,
  },
  photo: {
    width: 96,
    height: 96,
    borderRadius: radius.md,
  },
  headerTexts: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  detail: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 3,
  },
  price: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginTop: 6,
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
  statusPaused: {
    color: colors.textLight,
  },
    editButton: {
    marginTop: spacing.md,
  },
  pause: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  pauseTexts: {
    flex: 1,
  },
  pauseTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  pauseDescription: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  error: {
    fontSize: 12,
    color: colors.primary,
    marginTop: spacing.sm,
  },
  earnings: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.chip,
  },
  earningsLabel: {
    fontSize: 12,
    color: colors.textLight,
  },
  earningsValue: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    marginTop: 2,
  },
  earningsNote: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 2,
  },
  cards: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  card: {
    // Dos tarjetas por fila, descontando el espacio entre ellas
    flexBasis: "48%",
    flexGrow: 1,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cardValue: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
  },
  cardLabel: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  section: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  empty: {
    fontSize: 12,
    color: colors.textLight,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.chip,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  rowTexts: {
    flex: 1,
  },
  name: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  vehicle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  remaining: {
    fontSize: 11,
    fontWeight: "600",
    color: "#2E7D32",
    marginTop: 3,
  },
  value: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
  },
  valueStrikethrough: {
    color: colors.textLight,
    textDecorationLine: "line-through",
  },
  rating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  ratingText: {
    fontSize: 12,
    color: colors.text,
  },
  rated: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.xs,
  },
  action: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
    marginTop: spacing.xs,
  },
});