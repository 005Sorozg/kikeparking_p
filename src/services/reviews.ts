import type { ImageSourcePropType } from "react-native";
import { apiRequest } from "./api";

interface ResenaApi {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  author: {
    name: string;
    avatarUrl: string | null;
  };
}

export interface Resena {
  id: number;
  estrellas: number;
  comentario: string | null;
  fecha: Date;
  autor: {
    nombre: string;
    foto?: ImageSourcePropType;
  };
}

const aResena = (r: ResenaApi): Resena => ({
  id: r.id,
  estrellas: r.rating,
  comentario: r.comment,
  fecha: new Date(r.createdAt),
  autor: {
    nombre: r.author.name,
    foto: r.author.avatarUrl ? { uri: r.author.avatarUrl } : undefined,
  },
});

// POST /bookings/:id/review: calificar una reserva completada.
// El conductor califica el parqueadero; el propietario, al conductor (lo decide el backend).
export async function calificarReserva(
  reservaId: number,
  estrellas: number,
  comentario: string,
  token: string,
): Promise<Resena> {
  const dato = await apiRequest<ResenaApi>(`/bookings/${reservaId}/review`, {
    method: "POST",
    token,
    body: { rating: estrellas, comment: comentario.trim() || undefined },
  });

  return aResena(dato);
}

// GET /parking-spots/:id/reviews: lo que dijeron los conductores de un parqueadero.
export async function obtenerResenas(parqueaderoId: string): Promise<Resena[]> {
  const datos = await apiRequest<ResenaApi[]>(`/parking-spots/${parqueaderoId}/reviews`);

  return datos.map(aResena);
}

const MESES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

// "nov. de 2026"
export const formatearMesResena = (fecha: Date) =>
  `${MESES[fecha.getMonth()]}. de ${fecha.getFullYear()}`;