// Reservas ficticias en memoria (se reemplazan por la API más adelante).
export type VehicleKind = "carro" | "moto";

export interface Booking {
  id: string;
  parkingSpotId: string;
  vehiculo: VehicleKind;
  // Fecha de entrada en ISO (YYYY-MM-DD) y cantidad de días reservados.
  entrada: string;
  dias: number;
  total: number;
}

const MESES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

export const aIso = (fecha: Date) =>
  `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;

const desdeIso = (iso: string) => {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(a, m - 1, d);
};

export const formatearFecha = (iso: string) => {
  const f = desdeIso(iso);
  return `${f.getDate()} de ${MESES[f.getMonth()]}.`;
};

// "3 - 5 de feb." o "30 de ene. - 2 de feb." si cruza de mes.
export const formatearRango = (entrada: string, dias: number) => {
  const inicio = desdeIso(entrada);
  const fin = new Date(inicio);
  fin.setDate(fin.getDate() + dias);
  if (inicio.getMonth() === fin.getMonth()) {
    return `${inicio.getDate()} - ${fin.getDate()} de ${MESES[fin.getMonth()]}.`;
  }
  return `${formatearFecha(entrada)} - ${formatearFecha(aIso(fin))}`;
};

export const esProxima = (reserva: Booking) => {
  const fin = desdeIso(reserva.entrada);
  fin.setDate(fin.getDate() + reserva.dias);
  return fin.getTime() >= desdeIso(aIso(new Date())).getTime();
};

export const bookings: Booking[] = [
  { id: "b1", parkingSpotId: "1", vehiculo: "carro", entrada: "2026-05-01", dias: 2, total: 100000 },
  { id: "b2", parkingSpotId: "4", vehiculo: "carro", entrada: "2026-04-18", dias: 1, total: 48000 },
  { id: "b3", parkingSpotId: "2", vehiculo: "moto", entrada: "2026-02-03", dias: 1, total: 65000 },
  { id: "b4", parkingSpotId: "3", vehiculo: "carro", entrada: "2025-12-12", dias: 3, total: 105000 },
];

export const agregarReserva = (reserva: Omit<Booking, "id">) => {
  const nueva = { ...reserva, id: `b${bookings.length + 1}` };
  bookings.unshift(nueva);
  return nueva;
};
