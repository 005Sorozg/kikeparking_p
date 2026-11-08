import type { ImageSourcePropType } from "react-native";
import { apiRequest } from "./api";

// ---------- Datos reales (API) ----------

// Así responde el backend.
interface MensajeApi {
  id: number;
  text: string;
  senderId: number;
  mine: boolean;
  createdAt: string;
}

interface ConversacionApi {
  id: number;
  parkingSpot: {
    id: number;
    title: string;
    neighborhood: string;
    coverUrl: string | null;
  };
  otherUser: {
    id: number;
    name: string;
    avatarUrl: string | null;
  };
  lastMessage: MensajeApi | null;
  unreadCount: number;
  archived: boolean;
  lastMessageAt: string;
}

// Así los usan las pantallas.
export interface Mensaje {
  id: number;
  texto: string;
  // true si lo envió el usuario que tiene la sesión
  mio: boolean;
  fecha: Date;
}

export interface Conversacion {
  id: string;
  // La otra persona del chat
  contacto: {
    nombre: string;
    foto?: ImageSourcePropType;
  };
  parqueadero: {
    id: string;
    titulo: string;
    barrio: string;
    foto?: ImageSourcePropType;
  };
  ultimoMensaje: Mensaje | null;
  noLeidos: number;
  archivada: boolean;
  fecha: Date;
}

const aMensaje = (m: MensajeApi): Mensaje => ({
  id: m.id,
  texto: m.text,
  mio: m.mine,
  fecha: new Date(m.createdAt),
});

const aConversacion = (c: ConversacionApi): Conversacion => ({
  id: String(c.id),
  contacto: {
    nombre: c.otherUser.name,
    foto: c.otherUser.avatarUrl ? { uri: c.otherUser.avatarUrl } : undefined,
  },
  parqueadero: {
    id: String(c.parkingSpot.id),
    titulo: c.parkingSpot.title,
    barrio: c.parkingSpot.neighborhood,
    foto: c.parkingSpot.coverUrl ? { uri: c.parkingSpot.coverUrl } : undefined,
  },
  ultimoMensaje: c.lastMessage ? aMensaje(c.lastMessage) : null,
  noLeidos: c.unreadCount,
  archivada: c.archived,
  fecha: new Date(c.lastMessageAt),
});

// POST /conversations (conductor): abre el chat con el dueño del parqueadero,
// o devuelve el que ya existía.
export async function abrirConversacion(
  parqueaderoId: string,
  token: string,
): Promise<Conversacion> {
  const dato = await apiRequest<ConversacionApi>("/conversations", {
    method: "POST",
    token,
    body: { parkingSpotId: Number(parqueaderoId) },
  });

  return aConversacion(dato);
}

// GET /conversations: los chats del usuario (o los archivados).
export async function obtenerConversaciones(
  token: string,
  archivadas = false,
): Promise<Conversacion[]> {
  const datos = await apiRequest<ConversacionApi[]>(
    `/conversations${archivadas ? "?archived=true" : ""}`,
    { token },
  );

  return datos.map(aConversacion);
}

// GET /conversations/:id/messages: los mensajes del chat.
// Con despuesDe, solo los que llegaron después de ese id (para revisar si hay nuevos).
export async function obtenerMensajes(
  conversacionId: string,
  token: string,
  despuesDe?: number,
): Promise<Mensaje[]> {
  const filtro = despuesDe !== undefined ? `?after=${despuesDe}` : "";
  const datos = await apiRequest<MensajeApi[]>(
    `/conversations/${conversacionId}/messages${filtro}`,
    { token },
  );

  return datos.map(aMensaje);
}

// POST /conversations/:id/messages: enviar un mensaje.
export async function enviarMensaje(
  conversacionId: string,
  texto: string,
  token: string,
): Promise<Mensaje> {
  const dato = await apiRequest<MensajeApi>(
    `/conversations/${conversacionId}/messages`,
    { method: "POST", token, body: { text: texto } },
  );

  return aMensaje(dato);
}

// PATCH /conversations/:id: archivar o desarchivar (solo para quien lo hace).
export async function archivarConversacion(
  conversacionId: string,
  archivada: boolean,
  token: string,
): Promise<void> {
  await apiRequest<void>(`/conversations/${conversacionId}`, {
    method: "PATCH",
    token,
    body: { archived: archivada },
  });
}

// DELETE /conversations/:id: eliminar para mí (la otra persona conserva el chat).
export async function eliminarConversacion(
  conversacionId: string,
  token: string,
): Promise<void> {
  await apiRequest<void>(`/conversations/${conversacionId}`, {
    method: "DELETE",
    token,
  });
}

// ---------- Formato de fechas ----------

const MESES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

const mismoDia = (a: Date, b: Date) => a.toDateString() === b.toDateString();

// "8:05 a. m."
export const formatearHoraMensaje = (fecha: Date) => {
  const h = fecha.getHours();
  const m = String(fecha.getMinutes()).padStart(2, "0");
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${h < 12 ? "a. m." : "p. m."}`;
};

// Para separar los días dentro del chat: "Hoy", "Ayer" o "3 de nov."
export const formatearDia = (fecha: Date) => {
  const ayer = new Date();
  ayer.setDate(ayer.getDate() - 1);

  if (mismoDia(fecha, new Date())) return "Hoy";
  if (mismoDia(fecha, ayer)) return "Ayer";
  return `${fecha.getDate()} de ${MESES[fecha.getMonth()]}.`;
};

// Para la lista: la hora si fue hoy, "Ayer", o la fecha corta ("3 de nov.").
export const formatearFechaChat = (fecha: Date) => {
  const ayer = new Date();
  ayer.setDate(ayer.getDate() - 1);

  if (mismoDia(fecha, new Date())) return formatearHoraMensaje(fecha);
  if (mismoDia(fecha, ayer)) return "Ayer";
  return `${fecha.getDate()} de ${MESES[fecha.getMonth()]}.`;
};
