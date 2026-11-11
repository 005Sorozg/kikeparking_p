import type { ImageSourcePropType } from "react-native";
import { apiRequest } from "./api";


export type VehicleKind = "carro" | "moto";
export type BookingStatus = "pending_payment" | "confirmed" | "cancelled";
export type BookingPhase =
  | "pending_payment"
  | "expired"
  | "upcoming"
  | "in_progress"
  | "completed"
  | "cancelled";

// ---------- Datos reales (API) ----------

// Así responde el backend (/bookings).
interface BookingApi {
  id: number;
  vehicleType: VehicleKind;
  startAt: string;
  endAt: string;
  hours: number;
  totalPrice: number;
  status: BookingStatus;
  phase: BookingPhase;
  paymentDeadline: string | null;
  payment: { brand: string; last4: string; paidAt: string } | null;
  refunded: boolean;
  parkingSpot: {
    id: number;
    title: string;
    neighborhood: string;
    address: string;
    pricePerHour: number;
    photoUrl?: string | null;
  };
  driver: {
    id: number;
    name: string;
    rating: number;
    reviewCount: number;
  };
  myReview: { rating: number } | null;
}

// Así la usan las pantallas.
export interface Booking {
  id: number;
  vehicle: VehicleKind;
  start: Date;
  end: Date;
  hours: number;
  total: number;
  status: BookingStatus;
  phase: BookingPhase;
  // Hasta cuándo puede pagar (solo si está pendiente de pago)
  paymentDeadline: Date | null;
  // Con qué tarjeta se pagó (solo marca y últimos 4), o null si no se ha pagado
  payment: { brand: string; last4: string } | null;
  // Se canceló después de pagar y se devolvió el dinero
  refunded: boolean;
  parkingSpot: {
    id: string;
    title: string;
    neighborhood: string;
    address: string;
    image?: ImageSourcePropType;
  };
  driver: {
    id: number;
    name: string;
    rating: number;
    reviewCount: number;
  };
  // Estrellas que puse yo en esta reserva, o null si todavía no califico
  myRating: number | null;
}

const toBooking = (r: BookingApi): Booking => ({
  id: r.id,
  vehicle: r.vehicleType,
  start: new Date(r.startAt),
  end: new Date(r.endAt),
  hours: r.hours,
  total: r.totalPrice,
  status: r.status,
  phase: r.phase,
  paymentDeadline: r.paymentDeadline ? new Date(r.paymentDeadline) : null,
  payment: r.payment ? { brand: r.payment.brand, last4: r.payment.last4 } : null,
  refunded: r.refunded ?? false,
  parkingSpot: {
    id: String(r.parkingSpot.id),
    title: r.parkingSpot.title,
    neighborhood: r.parkingSpot.neighborhood,
    address: r.parkingSpot.address,
        image: r.parkingSpot.photoUrl ? { uri: r.parkingSpot.photoUrl } : undefined,
  },
  driver: {
    id: r.driver.id,
    name: r.driver.name,
    rating: r.driver.rating,
    reviewCount: r.driver.reviewCount,
  },
  myRating: r.myReview?.rating ?? null,
});

export interface BookingInput {
  parkingSpotId: string;
  vehicle: VehicleKind;
  start: Date;
  hours: number;
}

// POST /bookings (solo conductores). El precio lo calcula el backend.
export async function createBooking(
  data: BookingInput,
  token: string,
): Promise<Booking> {
  const result = await apiRequest<BookingApi>("/bookings", {
    method: "POST",
    token,
    body: {
      parkingSpotId: Number(data.parkingSpotId),
      vehicleType: data.vehicle,
      // toISOString va en UTC; el backend guarda la hora exacta sin importar la zona.
      startAt: data.start.toISOString(),
      hours: data.hours,
    },
  });

  return toBooking(result);
}

// GET /bookings/mine (conductor): las reservas que hizo.
export async function getMyBookings(token: string): Promise<Booking[]> {
  const data = await apiRequest<BookingApi[]>("/bookings/mine", { token });

  return data.map(toBooking);
}

export async function getReceivedBookings(
  token: string,
  parkingSpotId?: string,
): Promise<Booking[]> {
  const filter = parkingSpotId ? `?parkingSpotId=${parkingSpotId}` : "";
  const data = await apiRequest<BookingApi[]>(`/bookings/received${filter}`, {
    token,
  });

  return data.map(toBooking);
}

// PATCH /bookings/:id/cancel (el conductor que reservó o el dueño).
export async function cancelBooking(
  id: number,
  token: string,
): Promise<Booking> {
  const result = await apiRequest<BookingApi>(`/bookings/${id}/cancel`, {
    method: "PATCH",
    token,
  });

  return toBooking(result);
}

export interface CardData {
  cardNumber: string;
  // "MM/AA"
  expiry: string;
  cvc: string;
  name: string;
}

// POST /bookings/:id/pay (pasarela simulada). Si el "banco" la rechaza, el backend
// responde con error y la reserva sigue pendiente para intentar con otra tarjeta.
export async function payBooking(
  id: number,
  card: CardData,
  token: string,
): Promise<Booking> {
  const result = await apiRequest<BookingApi>(`/bookings/${id}/pay`, {
    method: "POST",
    token,
    body: {
      cardNumber: card.cardNumber,
      expiry: card.expiry,
      cvc: card.cvc,
      holderName: card.name,
    },
  });

  return toBooking(result);
}

export interface BusySlot {
  start: Date;
  end: Date;
}

// GET /bookings/occupied?parkingSpotId=: horarios ya reservados de un parqueadero.
export async function getBusySlots(
  parkingSpotId: string,
  token: string,
): Promise<BusySlot[]> {
  const data = await apiRequest<{ startAt: string; endAt: string }[]>(
    `/bookings/occupied?parkingSpotId=${parkingSpotId}`,
    { token },
  );

  return data.map((d) => ({
    start: new Date(d.startAt),
    end: new Date(d.endAt),
  }));
}

// ---------- Formato de fechas ----------

const MONTHS = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

// "7 de nov."
export const formatDate = (date: Date) =>
  `${date.getDate()} de ${MONTHS[date.getMonth()]}.`;

// "8:00 a. m."
export const formatHour = (date: Date) => {
  const h = date.getHours();
  const m = String(date.getMinutes()).padStart(2, "0");
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${h < 12 ? "a. m." : "p. m."}`;
};

// "7 de nov. · 8:00 a. m. - 11:00 a. m." o, si pasa a otro día,
// "7 de nov. 8:00 p. m. - 8 de nov. 2:00 a. m."
export const formatRange = (start: Date, end: Date) => {
  if (sameDay(start, end)) {
    return `${formatDate(start)} · ${formatHour(start)} - ${formatHour(end)}`;
  }
  return `${formatDate(start)} ${formatHour(start)} - ${formatDate(end)} ${formatHour(end)}`;
};

// Una pendiente cuyo tiempo para pagar ya pasó se muestra como vencida sin recargar.
export const currentPhase = (booking: Booking): BookingPhase =>
  booking.phase === "pending_payment" &&
  booking.paymentDeadline &&
  booking.paymentDeadline.getTime() <= Date.now()
    ? "expired"
    : booking.phase;

// Cuenta regresiva para pagar: "9:05"
export const timeToPay = (limit: Date) => {
  const seconds = Math.max(0, Math.floor((limit.getTime() - Date.now()) / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
};

// Próxima = confirmada y todavía no empieza.
export const isUpcoming = (booking: Booking) => booking.phase === "upcoming";

// Para una reserva en curso: "1 h 20 min" o "35 min" hasta la salida.
export const timeLeft = (end: Date) => {
  const minutes = Math.max(0, Math.round((end.getTime() - Date.now()) / 60000));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
};

// ---------- Estadísticas (vista del propietario) ----------

export interface Stats {
  // Reservas confirmadas, o sea pagadas (las pendientes y canceladas no cuentan)
  total: number;
  upcomingBookings: number;
  hours: number;
  // Suma de las confirmadas, incluidas las que aún no ocurren
  earnings: number;
  cancelledBookings: number;
}

export const calculateStats = (bookings: Booking[]): Stats => {
  const confirmed = bookings.filter((r) => r.status === "confirmed");

  return {
    total: confirmed.length,
    upcomingBookings: confirmed.filter(isUpcoming).length,
    hours: confirmed.reduce((sum, r) => sum + r.hours, 0),
    earnings: confirmed.reduce((sum, r) => sum + r.total, 0),
        cancelledBookings: bookings.filter((r) => r.status === "cancelled").length,
  };
};