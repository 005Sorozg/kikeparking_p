import type { ImageSourcePropType } from "react-native";
import { apiRequest } from "./api";


export type VehicleKind = "carro" | "moto";
export type EstadoReserva = "confirmed" | "cancelled";
export type FaseReserva = "upcoming" | "in_progress" | "completed" | "cancelled";

// ---------- Datos reales (API) ----------

// Así responde el backend (/bookings).
interface ReservaApi {
  id: number;
  vehicleType: VehicleKind;
  startAt: string;
  endAt: string;
  hours: number;
  totalPrice: number;
  status: EstadoReserva;
  phase: FaseReserva;
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
export interface Reserva {
  id: number;
  vehiculo: VehicleKind;
  entrada: Date;
  salida: Date;
  horas: number;
  total: number;
  estado: EstadoReserva;
  fase: FaseReserva;
  parqueadero: {
    id: string;
    titulo: string;
    barrio: string;
    direccion: string;
    imagen?: ImageSourcePropType;
  };
  conductor: {
    id: number;
    nombre: string;
    calificacion: number;
    resenas: number;
  };
  // Estrellas que puse yo en esta reserva, o null si todavía no califico
  miCalificacion: number | null;
}

const aReserva = (r: ReservaApi): Reserva => ({
  id: r.id,
  vehiculo: r.vehicleType,
  entrada: new Date(r.startAt),
  salida: new Date(r.endAt),
  horas: r.hours,
  total: r.totalPrice,
  estado: r.status,
  fase: r.phase,
  parqueadero: {
    id: String(r.parkingSpot.id),
    titulo: r.parkingSpot.title,
    barrio: r.parkingSpot.neighborhood,
    direccion: r.parkingSpot.address,
        imagen: r.parkingSpot.photoUrl ? { uri: r.parkingSpot.photoUrl } : undefined,
  },
  conductor: {
    id: r.driver.id,
    nombre: r.driver.name,
    calificacion: r.driver.rating,
    resenas: r.driver.reviewCount,
  },
  miCalificacion: r.myReview?.rating ?? null,
});

export interface DatosReserva {
  parqueaderoId: string;
  vehiculo: VehicleKind;
  entrada: Date;
  horas: number;
}

// POST /bookings (solo conductores). El precio lo calcula el backend.
export async function crearReserva(
  datos: DatosReserva,
  token: string,
): Promise<Reserva> {
  const dato = await apiRequest<ReservaApi>("/bookings", {
    method: "POST",
    token,
    body: {
      parkingSpotId: Number(datos.parqueaderoId),
      vehicleType: datos.vehiculo,
      // toISOString va en UTC; el backend guarda la hora exacta sin importar la zona.
      startAt: datos.entrada.toISOString(),
      hours: datos.horas,
    },
  });

  return aReserva(dato);
}

// GET /bookings/mine (conductor): las reservas que hizo.
export async function obtenerMisReservas(token: string): Promise<Reserva[]> {
  const datos = await apiRequest<ReservaApi[]>("/bookings/mine", { token });

  return datos.map(aReserva);
}

export async function obtenerReservasRecibidas(
  token: string,
  parqueaderoId?: string,
): Promise<Reserva[]> {
  const filtro = parqueaderoId ? `?parkingSpotId=${parqueaderoId}` : "";
  const datos = await apiRequest<ReservaApi[]>(`/bookings/received${filtro}`, {
    token,
  });

  return datos.map(aReserva);
}

// PATCH /bookings/:id/cancel (el conductor que reservó o el dueño).
export async function cancelarReserva(
  id: number,
  token: string,
): Promise<Reserva> {
  const dato = await apiRequest<ReservaApi>(`/bookings/${id}/cancel`, {
    method: "PATCH",
    token,
  });

  return aReserva(dato);
}

export interface HorarioOcupado {
  entrada: Date;
  salida: Date;
}

// GET /bookings/occupied?parkingSpotId=: horarios ya reservados de un parqueadero.
export async function obtenerHorariosOcupados(
  parqueaderoId: string,
  token: string,
): Promise<HorarioOcupado[]> {
  const datos = await apiRequest<{ startAt: string; endAt: string }[]>(
    `/bookings/occupied?parkingSpotId=${parqueaderoId}`,
    { token },
  );

  return datos.map((d) => ({
    entrada: new Date(d.startAt),
    salida: new Date(d.endAt),
  }));
}

// ---------- Formato de fechas ----------

const MESES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

const mismoDia = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

// "7 de nov."
export const formatearFecha = (fecha: Date) =>
  `${fecha.getDate()} de ${MESES[fecha.getMonth()]}.`;

// "8:00 a. m."
export const formatearHora = (fecha: Date) => {
  const h = fecha.getHours();
  const m = String(fecha.getMinutes()).padStart(2, "0");
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${h < 12 ? "a. m." : "p. m."}`;
};

// "7 de nov. · 8:00 a. m. - 11:00 a. m." o, si pasa a otro día,
// "7 de nov. 8:00 p. m. - 8 de nov. 2:00 a. m."
export const formatearRango = (entrada: Date, salida: Date) => {
  if (mismoDia(entrada, salida)) {
    return `${formatearFecha(entrada)} · ${formatearHora(entrada)} - ${formatearHora(salida)}`;
  }
  return `${formatearFecha(entrada)} ${formatearHora(entrada)} - ${formatearFecha(salida)} ${formatearHora(salida)}`;
};

// Próxima = confirmada y todavía no empieza.
export const esProxima = (reserva: Reserva) => reserva.fase === "upcoming";

// Para una reserva en curso: "1 h 20 min" o "35 min" hasta la salida.
export const tiempoRestante = (salida: Date) => {
  const minutos = Math.max(0, Math.round((salida.getTime() - Date.now()) / 60000));
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;

  if (horas === 0) return `${resto} min`;
  return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`;
};

// ---------- Estadísticas (vista del propietario) ----------

export interface Estadisticas {
  // Reservas confirmadas (las canceladas no cuentan)
  total: number;
  proximas: number;
  horas: number;
  // Suma de las confirmadas, incluidas las que aún no ocurren
  ingresos: number;
  canceladas: number;
}

export const calcularEstadisticas = (reservas: Reserva[]): Estadisticas => {
  const confirmadas = reservas.filter((r) => r.estado === "confirmed");

  return {
    total: confirmadas.length,
    proximas: confirmadas.filter(esProxima).length,
    horas: confirmadas.reduce((suma, r) => suma + r.horas, 0),
    ingresos: confirmadas.reduce((suma, r) => suma + r.total, 0),
    canceladas: reservas.length - confirmadas.length,
  };
};