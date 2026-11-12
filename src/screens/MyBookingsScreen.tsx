import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import type { AppScreenProps } from "../types/navigation";
import { formatPrice } from "../services/parking";
import {
  BookingPhase,
  Booking,
  cancelBooking,
  isUpcoming,
  currentPhase,
  formatRange,
  getMyBookings,
  getReceivedBookings,
  timeToPay,
  timeLeft,
} from "../services/bookings";
import { BookingPhaseTag } from "../components/BookingPhaseTag";
import { ReviewModal } from "../components/ReviewModal";
import { Stars } from "../components/Stars";
import { useAuth } from "../context/AuthContext";
import { syncReminders } from "../services/reminders";
import { Chip, ImagePlaceholder } from "../components/ui";
import { colors, radius, spacing } from "../styles/theme";

// Cada filtro muestra las reservas de uno o más estados
// (las pendientes de pago van con las próximas y las vencidas con las canceladas)
const FILTERS: { id: BookingPhase; includes: BookingPhase[]; label: string; empty: string }[] = [
  { id: "upcoming", includes: ["upcoming", "pending_payment"], label: "Próximas", empty: "No tienes reservas próximas." },
  { id: "in_progress", includes: ["in_progress"], label: "En curso", empty: "No hay reservas en curso ahora." },
  { id: "completed", includes: ["completed"], label: "Completadas", empty: "Todavía no hay reservas completadas." },
  { id: "cancelled", includes: ["cancelled", "expired"], label: "Canceladas", empty: "No hay reservas canceladas." },
];

// Reservas: el conductor ve las que hizo y el propietario las que recibió.
export function MyBookingsScreen({ navigation }: AppScreenProps<"MyBookings">) {
  const { user, token } = useAuth();
  const isOwner = user?.role === "propietario";
  const [filter, setFilter] = useState<BookingPhase>("upcoming");
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Reserva que está pidiendo confirmación para cancelarse.
  const [confirming, setConfirming] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState<number | null>(null);
  // Reserva que se está calificando (abre la ventana de calificar)
  const [reviewingBooking, setReviewingBooking] = useState<Booking | null>(null);
  // Si hay alguna pendiente de pago, se redibuja cada segundo para la cuenta regresiva
  const hasPending = (bookings ?? []).some((r) => currentPhase(r) === "pending_payment");
  const [, setTic] = useState(0);
  useEffect(() => {
    if (!hasPending) return;
    const interval = setInterval(() => setTic((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [hasPending]);

  // Se recarga cada vez que la pantalla se vuelve a mostrar.
  useFocusEffect(
    useCallback(() => {
      if (!token) {
        setError("Debes iniciar sesión para ver tus reservas.");
        return;
      }

      let active = true;
      const request = isOwner ? getReceivedBookings : getMyBookings;

      request(token)
        .then((data) => {
          if (active) {
            setBookings(data);
            setError(null);
            // De paso, los recordatorios quedan al día con lo que se ve aquí
            syncReminders(data, isOwner);
          }
        })
        .catch((e) => {
          if (active) {
            setError(
              e instanceof Error ? e.message : "No se pudieron cargar las reservas.",
            );
          }
        });

      return () => {
        active = false;
      };
    }, [token, isOwner]),
  );

  const cancel = async (id: number) => {
    if (!token) return;

    setCancelling(id);
    try {
      const updated = await cancelBooking(id, token);
      const list = (bookings ?? []).map((r) => (r.id === id ? updated : r));
      setBookings(list);
      // La reserva cancelada ya no debe recordar nada
      syncReminders(list, isOwner);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cancelar la reserva.");
    } finally {
      setCancelling(null);
      setConfirming(null);
    }
  };

  const included = FILTERS.find((f) => f.id === filter)?.includes ?? [];
  const visibleItems = (bookings ?? [])
    .filter((r) => included.includes(currentPhase(r)))
    // Próximas y en curso: la más cercana primero. Las demás: la más reciente primero.
    .sort((a, b) =>
      filter === "upcoming" || filter === "in_progress"
        ? a.start.getTime() - b.start.getTime()
        : b.start.getTime() - a.start.getTime(),
    );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {isOwner ? "Reservas recibidas" : "Reservas"}
      </Text>

      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {FILTERS.map((f) => (
            <Chip
              key={f.id}
              label={f.label}
              variant="filled"
              selected={filter === f.id}
              onPress={() => setFilter(f.id)}
            />
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {error && <Text style={styles.error}>{error}</Text>}

        {!bookings && !error && <ActivityIndicator color={colors.primary} />}

        {bookings && visibleItems.length === 0 && (
          <Text style={styles.empty}>
            {FILTERS.find((f) => f.id === filter)?.empty}
          </Text>
        )}

        {visibleItems.map((r) => {
          const phase = currentPhase(r);
          const isCancelled = r.status === "cancelled" || phase === "expired";
          const pending = phase === "pending_payment";
          // Se puede cancelar mientras no haya empezado (pagada o pendiente de pago)
          const cancelable = isUpcoming(r) || pending;
          return (
            <View key={r.id} style={styles.row}>
              <ImagePlaceholder
                style={styles.photo}
                iconSize={26}
                source={r.parkingSpot.image}
              />
              <View style={styles.texts}>
                <Text style={styles.name} numberOfLines={1}>
                  {r.parkingSpot.title}
                </Text>
                <Text style={styles.detail}>
                  {isOwner
                    ? `Reservó ${r.driver.name}${
                        r.driver.reviewCount > 0
                          ? ` · ★ ${r.driver.rating.toFixed(1)}`
                          : ""
                      }`
                    : `${r.parkingSpot.neighborhood} · ${r.parkingSpot.address}`}
                </Text>
                <Text style={styles.detail}>
                  {formatRange(r.start, r.end)}
                </Text>
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

                <BookingPhaseTag phase={phase} />

                {/* Pendiente de pago: el conductor paga, el propietario espera */}
                {pending && r.paymentDeadline && (
                  <Text style={styles.unpaid}>
                    {isOwner
                      ? "Esperando el pago del conductor"
                      : `Te quedan ${timeToPay(r.paymentDeadline)} para pagar`}
                  </Text>
                )}
                {pending && !isOwner && r.paymentDeadline && (
                  <Pressable
                    onPress={() =>
                      navigation.navigate("Payment", {
                        bookingId: r.id,
                        title: r.parkingSpot.title,
                        total: r.total,
                        paymentDeadline: r.paymentDeadline!.toISOString(),
                      })
                    }
                  >
                    <Text style={styles.action}>Pagar ahora</Text>
                  </Pressable>
                )}

                {/* Con qué se pagó (solo lo ve el conductor) */}
                {!isOwner && r.payment && (
                  <Text style={styles.detail}>
                    {r.refunded ? "Reembolsada a" : "Pagada con"} {r.payment.brand} ••••{" "}
                    {r.payment.last4}
                  </Text>
                )}
                {r.phase === "in_progress" && (
                  <Text style={styles.remaining}>
                    Termina en {timeLeft(r.end)}
                  </Text>
                )}

                {/* Completada: calificar una vez, o ver cuántas estrellas puse */}
                {r.phase === "completed" && r.myRating !== null && (
                  <View style={styles.rated}>
                    <Text style={styles.detail}>Calificaste</Text>
                    <Stars value={r.myRating} size={11} />
                  </View>
                )}
                {r.phase === "completed" && r.myRating === null && (
                  <Pressable onPress={() => setReviewingBooking(r)}>
                    <Text style={styles.action}>
                      {isOwner ? "Calificar conductor" : "Calificar"}
                    </Text>
                  </Pressable>
                )}

                {cancelable && confirming !== r.id && (
                  <Pressable onPress={() => setConfirming(r.id)}>
                    <Text style={styles.action}>Cancelar reserva</Text>
                  </Pressable>
                )}

                {cancelable && confirming === r.id && (
                  <View style={styles.confirm}>
                    <Text style={styles.detail}>¿Seguro?</Text>
                    <Pressable
                      onPress={() => cancel(r.id)}
                      disabled={cancelling === r.id}
                    >
                      <Text style={styles.action}>
                        {cancelling === r.id ? "Cancelando..." : "Sí, cancelar"}
                      </Text>
                    </Pressable>
                    <Pressable onPress={() => setConfirming(null)}>
                      <Text style={styles.secondaryAction}>No</Text>
                    </Pressable>
                  </View>
                )}
              </View>
              <Text style={[styles.price, isCancelled && styles.priceStrikethrough]}>
                {formatPrice(r.total)}
              </Text>
            </View>
          );
        })}
      </ScrollView>
      <ReviewModal
        bookingId={reviewingBooking?.id ?? null}
        title={
          isOwner
            ? `¿Cómo fue ${reviewingBooking?.driver.name ?? ""} como conductor?`
            : `¿Qué tal ${reviewingBooking?.parkingSpot.title ?? "el parqueadero"}?`
        }
        onClose={() => setReviewingBooking(null)}
        onRated={(id, stars) => {
          // Se marca como calificada sin volver a pedir la lista
          setBookings((current) =>
            (current ?? []).map((r) =>
              r.id === id ? { ...r, myRating: stars } : r,
            ),
          );
          setReviewingBooking(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    paddingHorizontal: 24,
    marginBottom: spacing.md,
  },
  chips: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: 24,
    paddingBottom: spacing.md,
  },
  list: {
    paddingHorizontal: 24,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  empty: {
    color: colors.textLight,
    fontSize: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    marginBottom: spacing.lg,
  },
  photo: {
    width: 64,
    height: 64,
    borderRadius: radius.sm,
  },
  texts: {
    flex: 1,
  },
  name: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.text,
  },
  detail: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 3,
  },
  vehicle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  price: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
  },
  priceStrikethrough: {
    color: colors.textLight,
    textDecorationLine: "line-through",
  },
  error: {
    color: colors.primary,
    fontSize: 12,
    marginBottom: spacing.md,
  },
  unpaid: {
    fontSize: 11,
    fontWeight: "600",
    color: "#B26A00",
    marginTop: 3,
  },
  remaining: {
    fontSize: 11,
    fontWeight: "600",
    color: "#2E7D32",
    marginTop: 3,
  },
  action: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
    marginTop: spacing.sm,
  },
  secondaryAction: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing.sm,
  },
  confirm: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing.md,
  },
  rated: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.sm,
  },
});