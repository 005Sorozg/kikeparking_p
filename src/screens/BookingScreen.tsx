import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Calendar, LocaleConfig } from "react-native-calendars";
import type { AppScreenProps } from "../types/navigation";
import {
  ParkingSpot,
  formatPrice,
  getParkingSpot,
} from "../services/parking";
import {
  BusySlot,
  VehicleKind,
  createBooking,
  formatHour,
  formatRange,
  getBusySlots,
} from "../services/bookings";
import { useAuth } from "../context/AuthContext";
import { Chip, ImagePlaceholder, PrimaryButton } from "../components/ui";
import { colors, radius, spacing } from "../styles/theme";

// Calendario en español (nombres de meses y días).
LocaleConfig.locales.es = {
  monthNames: [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ],
  monthNamesShort: [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
  ],
  dayNames: [
    "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado",
  ],
  dayNamesShort: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
  today: "Hoy",
};
LocaleConfig.defaultLocale = "es";

// Hasta cuántos días hacia adelante se puede reservar.
const DAYS_AHEAD = 60;
const MAX_HOURS = 24;
const HOUR_MS = 60 * 60 * 1000;
const DAY_HOURS = Array.from({ length: 24 }, (_, h) => h);

// Date -> "2026-11-07" (lo que usa el calendario), en hora local.
const toIso = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

// "2026-11-07" -> Date a medianoche, en hora local.
const fromIso = (iso: string) => {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(a, m - 1, d);
};

// Medianoche de hoy + i días.
const dayFromToday = (i: number) => {
  const f = new Date();
  f.setHours(0, 0, 0, 0);
  f.setDate(f.getDate() + i);
  return f;
};

// Horas de entrada que se pueden elegir ese día: hoy solo las que aún no pasan.
const possibleHours = (day: Date) => {
  const now = new Date();
  const isToday = day.toDateString() === now.toDateString();
  return isToday
    ? DAY_HOURS.filter((h) => h > now.getHours())
    : DAY_HOURS;
};

// El día elegido a la hora h en punto.
const atHour = (day: Date, h: number) => {
  const f = new Date(day);
  f.setHours(h, 0, 0, 0);
  return f;
};

// ¿El rango [inicio, fin) se cruza con alguna reserva? (misma regla que el backend)
const overlaps = (busySlots: BusySlot[], start: Date, end: Date) =>
  busySlots.some((o) => o.start < end && o.end > start);

// Horas en que se puede entrar ese día: que no hayan pasado y cuya primera hora esté libre.
const freeHours = (day: Date, busySlots: BusySlot[]) =>
  possibleHours(day).filter((h) => {
    const start = atHour(day, h);
    return !overlaps(busySlots, start, new Date(start.getTime() + HOUR_MS));
  });

// Cuántas horas se pueden reservar desde "entrada" sin chocar con la siguiente reserva.
const maxHoursFrom = (start: Date, busySlots: BusySlot[]) => {
  const upcoming = busySlots
    .filter((o) => o.start >= start)
    .map((o) => o.start.getTime());

  if (upcoming.length === 0) return MAX_HOURS;

  const hoursUntilNext = Math.floor(
    (Math.min(...upcoming) - start.getTime()) / HOUR_MS,
  );
  return Math.min(MAX_HOURS, hoursUntilNext);
};

// Reserva: día, hora de entrada, horas, vehículo y resumen del precio.
export function BookingScreen({
  route,
  navigation,
}: AppScreenProps<"Booking">) {
  const { user, token } = useAuth();
  const [spot, setSpot] = useState<ParkingSpot | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Si ya pasó la última hora de hoy, el primer día que se puede elegir es mañana.
  const firstDay = useMemo(
    () => (possibleHours(dayFromToday(0)).length > 0 ? dayFromToday(0) : dayFromToday(1)),
    [],
  );
  const lastDay = useMemo(() => dayFromToday(DAYS_AHEAD), []);

  const [busySlots, setBusySlots] = useState<BusySlot[]>([]);
  const [day, setDay] = useState(firstDay);
  const [hour, setHour] = useState<number | undefined>(possibleHours(firstDay)[0]);
  const [hours, setHours] = useState(2);
  const [vehicle, setVehicle] = useState<VehicleKind>("carro");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cambia al día "d" y, si la hora elegida no está libre ese día, toma la primera libre.
  const locate = (d: Date, list: BusySlot[]) => {
    const free = freeHours(d, list);
    setDay(d);
    setHour((current) =>
      current !== undefined && free.includes(current) ? current : free[0],
    );
  };

  // Pide los horarios ocupados y deja elegido un día con horas libres.
  const loadBusySlots = async (currentDay: Date) => {
    if (!token) return;

    const list = await getBusySlots(route.params.parkingSpotId, token);
    setBusySlots(list);

    let d = currentDay;
    while (freeHours(d, list).length === 0 && d < lastDay) {
      d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    }
    locate(d, list);
  };

  useEffect(() => {
    let active = true;

    loadBusySlots(firstDay).catch(() => {
      if (active) setError("No se pudieron cargar los horarios ocupados.");
    });

    getParkingSpot(route.params.parkingSpotId)
      .then((result) => {
        if (active) {
          setSpot(result);
          // Si no recibe carros, arranca con moto
          if (!result.features.acceptsCars) setVehicle("moto");
        }
      })
      .catch((e) => {
        if (active) {
          setLoadError(
            e instanceof Error ? e.message : "No se pudo cargar el parqueadero.",
          );
        }
      });

    return () => {
      active = false;
    };
  }, [route.params.parkingSpotId]);

  const pickDay = (iso: string) => {
    locate(fromIso(iso), busySlots);
    setError(null);
  };

  // Días sin ninguna hora libre: salen deshabilitados en el calendario.
  const fullDays = useMemo(() => {
    const brands: Record<string, { disabled: true; disableTouchEvent: true }> = {};
    const days = new Set(busySlots.map((o) => toIso(o.start)));

    days.forEach((iso) => {
      if (freeHours(fromIso(iso), busySlots).length === 0) {
        brands[iso] = { disabled: true, disableTouchEvent: true };
      }
    });
    return brands;
  }, [busySlots]);

  if (loadError) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>{loadError}</Text>
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

  const openHours = freeHours(day, busySlots);
  const hasHour = hour !== undefined && openHours.includes(hour);
  const start = atHour(day, hour ?? 0);
  // No se puede pasar de la siguiente reserva: si hay una en 3 horas, el máximo es 3.
  const maxHours = hasHour ? maxHoursFrom(start, busySlots) : 1;
  const bookingHours = Math.min(hours, maxHours);
  const end = new Date(start.getTime() + bookingHours * HOUR_MS);
  const total = spot.pricePerHour * bookingHours;
  const isDriver = user?.role === "conductor";

  const confirm = async () => {
    if (!token) {
      setError("Debes iniciar sesión para reservar.");
      return;
    }

    setSending(true);
    setError(null);

    try {
      // La reserva queda pendiente de pago y la hora apartada por 10 minutos
      const booking = await createBooking(
        { parkingSpotId: spot.id, vehicle, start, hours: bookingHours },
        token,
      );
      navigation.replace("Payment", {
        bookingId: booking.id,
        title: spot.title,
        total: booking.total,
        paymentDeadline: (booking.paymentDeadline ?? new Date()).toISOString(),
      });
    } catch (e) {
      // Ej: "El parqueadero ya está reservado en ese horario..." si alguien reservó
      // mientras tanto. Se recargan los ocupados para que ese horario salga en gris.
      setError(e instanceof Error ? e.message : "No se pudo crear la reserva.");
      setSending(false);
      loadBusySlots(day).catch(() => {});
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>Confirma tu reserva</Text>

      <View style={styles.summarySpot}>
        <ImagePlaceholder
          style={styles.photo}
          iconSize={26}
          source={spot.image}
        />
        <View style={styles.summaryTexts}>
          <Text style={styles.name} numberOfLines={1}>
            {spot.title}
          </Text>
          <Text style={styles.detail}>{spot.neighborhood}</Text>
          <Text style={styles.detail}>{spot.address}</Text>
        </View>
      </View>

      <Text style={styles.section}>Día</Text>
      <Calendar
        style={styles.calendar}
        current={toIso(day)}
        minDate={toIso(firstDay)}
        maxDate={toIso(lastDay)}
        firstDay={1}
        onDayPress={(d) => pickDay(d.dateString)}
        markedDates={{ ...fullDays, [toIso(day)]: { selected: true } }}
        theme={{
          calendarBackground: colors.background,
          selectedDayBackgroundColor: colors.primary,
          selectedDayTextColor: colors.white,
          todayTextColor: colors.primary,
          dayTextColor: colors.text,
          textDisabledColor: colors.borderLight,
          arrowColor: colors.primary,
          monthTextColor: colors.text,
          textMonthFontWeight: "700",
          textSectionTitleColor: colors.textLight,
        }}
      />

      <Text style={styles.section}>Hora de entrada</Text>
      <View style={styles.hours}>
        {possibleHours(day).map((h) => {
          const busy = !openHours.includes(h);
          return (
            <Chip
              key={h}
              label={formatHour(atHour(day, h))}
              selected={hour === h && !busy}
              disabled={busy}
              onPress={() => {
                setHour(h);
                setError(null);
              }}
            />
          );
        })}
      </View>

      <Text style={styles.section}>Horas</Text>
      <View style={styles.counter}>
        <Pressable
          style={styles.circle}
          onPress={() => setHours(Math.max(1, bookingHours - 1))}
        >
          <Feather name="minus" size={17} color={colors.text} />
        </Pressable>
        <Text style={styles.counterValue}>{bookingHours}</Text>
        <Pressable
          style={styles.circle}
          onPress={() => setHours(Math.min(maxHours, bookingHours + 1))}
        >
          <Feather name="plus" size={17} color={colors.text} />
        </Pressable>
      </View>
      {hasHour && maxHours < MAX_HOURS && (
        <Text style={styles.notice}>
          Máximo {maxHours} {maxHours === 1 ? "hora" : "horas"}: a las{" "}
          {formatHour(new Date(start.getTime() + maxHours * HOUR_MS))} ya
          está reservado.
        </Text>
      )}

      <Text style={styles.section}>Vehículo</Text>
      {/* Solo los vehículos que recibe este parqueadero */}
      <View style={styles.chips}>
        {spot.features.acceptsCars && (
          <Chip
            label="Carro"
            icon="truck"
            selected={vehicle === "carro"}
            onPress={() => setVehicle("carro")}
          />
        )}
        {spot.features.acceptsMotorcycles && (
          <Chip
            label="Moto"
            icon="navigation"
            selected={vehicle === "moto"}
            onPress={() => setVehicle("moto")}
          />
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.detail}>{formatRange(start, end)}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.name}>
            {formatPrice(spot.pricePerHour)} x {bookingHours}{" "}
            {bookingHours === 1 ? "hora" : "horas"}
          </Text>
          <Text style={styles.name}>{formatPrice(total)}</Text>
        </View>
        <View style={[styles.priceRow, styles.totalRow]}>
          <Text style={styles.total}>Total</Text>
          <Text style={styles.total}>{formatPrice(total)}</Text>
        </View>
      </View>

      {!isDriver && (
        <Text style={styles.notice}>
          Las reservas son para cuentas de conductor.
        </Text>
      )}
      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.button}>
        <PrimaryButton
          label={sending ? "Reservando..." : "Continuar al pago"}
          onPress={confirm}
          disabled={sending || !isDriver || !spot.available || !hasHour}
        />
      </View>
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
    paddingBottom: spacing.xl,
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
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.md,
  },
  summarySpot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  photo: {
    width: 64,
    height: 64,
    borderRadius: radius.sm,
  },
  summaryTexts: {
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
  section: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  chips: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  counter: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  circle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.chip,
    alignItems: "center",
    justifyContent: "center",
  },
  counterValue: {
    minWidth: 24,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  card: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  totalRow: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  total: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  hours: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  calendar: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.lg,
    paddingBottom: spacing.sm,
  },
  notice: {
    marginTop: spacing.md,
    fontSize: 12,
    color: colors.textLight,
  },
  error: {
    marginTop: spacing.md,
    fontSize: 12,
    color: colors.primary,
  },
  button: {
    marginTop: spacing.lg,
  },
});
