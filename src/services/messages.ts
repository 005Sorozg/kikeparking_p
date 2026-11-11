import type { ImageSourcePropType } from "react-native";
import { apiRequest } from "./api";

// ---------- Datos reales (API) ----------

// Así responde el backend.
interface MessageApi {
  id: number;
  text: string;
  senderId: number;
  mine: boolean;
  createdAt: string;
}

interface ConversationApi {
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
  lastMessage: MessageApi | null;
  unreadCount: number;
  archived: boolean;
  lastMessageAt: string;
}

// Así los usan las pantallas.
export interface Message {
  id: number;
  text: string;
  // true si lo envió el usuario que tiene la sesión
  isMine: boolean;
  date: Date;
}

export interface Conversation {
  id: string;
  // La otra persona del chat
  contact: {
    name: string;
    photo?: ImageSourcePropType;
  };
  parkingSpot: {
    id: string;
    title: string;
    neighborhood: string;
    photo?: ImageSourcePropType;
  };
  lastMessage: Message | null;
  unread: number;
  archived: boolean;
  date: Date;
}

const toMessage = (m: MessageApi): Message => ({
  id: m.id,
  text: m.text,
  isMine: m.mine,
  date: new Date(m.createdAt),
});

const toConversation = (c: ConversationApi): Conversation => ({
  id: String(c.id),
  contact: {
    name: c.otherUser.name,
    photo: c.otherUser.avatarUrl ? { uri: c.otherUser.avatarUrl } : undefined,
  },
  parkingSpot: {
    id: String(c.parkingSpot.id),
    title: c.parkingSpot.title,
    neighborhood: c.parkingSpot.neighborhood,
    photo: c.parkingSpot.coverUrl ? { uri: c.parkingSpot.coverUrl } : undefined,
  },
  lastMessage: c.lastMessage ? toMessage(c.lastMessage) : null,
  unread: c.unreadCount,
  archived: c.archived,
  date: new Date(c.lastMessageAt),
});

// POST /conversations (conductor): abre el chat con el dueño del parqueadero,
// o devuelve el que ya existía.
export async function openConversation(
  parkingSpotId: string,
  token: string,
): Promise<Conversation> {
  const result = await apiRequest<ConversationApi>("/conversations", {
    method: "POST",
    token,
    body: { parkingSpotId: Number(parkingSpotId) },
  });

  return toConversation(result);
}

// GET /conversations: los chats del usuario (o los archivados).
export async function getConversations(
  token: string,
  archivedChats = false,
): Promise<Conversation[]> {
  const data = await apiRequest<ConversationApi[]>(
    `/conversations${archivedChats ? "?archived=true" : ""}`,
    { token },
  );

  return data.map(toConversation);
}

// GET /conversations/unread-count: total de mensajes sin leer (el número de la pestaña).
export async function getUnreadCount(token: string): Promise<number> {
  const result = await apiRequest<{ count: number }>("/conversations/unread-count", {
    token,
  });

  return result.count;
}

// GET /conversations/:id/messages: los mensajes del chat.
// Con after, solo los que llegaron después de ese id (para revisar si hay nuevos).
export async function getMessages(
  conversationId: string,
  token: string,
  after?: number,
): Promise<Message[]> {
  const filter = after !== undefined ? `?after=${after}` : "";
  const data = await apiRequest<MessageApi[]>(
    `/conversations/${conversationId}/messages${filter}`,
    { token },
  );

  return data.map(toMessage);
}

// POST /conversations/:id/messages: enviar un mensaje.
export async function sendMessage(
  conversationId: string,
  text: string,
  token: string,
): Promise<Message> {
  const result = await apiRequest<MessageApi>(
    `/conversations/${conversationId}/messages`,
    { method: "POST", token, body: { text } },
  );

  return toMessage(result);
}

// PATCH /conversations/:id: archivar o desarchivar (solo para quien lo hace).
export async function archiveConversation(
  conversationId: string,
  archived: boolean,
  token: string,
): Promise<void> {
  await apiRequest<void>(`/conversations/${conversationId}`, {
    method: "PATCH",
    token,
    body: { archived },
  });
}

// DELETE /conversations/:id: eliminar para mí (la otra persona conserva el chat).
export async function deleteConversation(
  conversationId: string,
  token: string,
): Promise<void> {
  await apiRequest<void>(`/conversations/${conversationId}`, {
    method: "DELETE",
    token,
  });
}

// ---------- Formato de fechas ----------

const MONTHS = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

// "8:05 a. m."
export const formatMessageTime = (date: Date) => {
  const h = date.getHours();
  const m = String(date.getMinutes()).padStart(2, "0");
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${h < 12 ? "a. m." : "p. m."}`;
};

// Para separar los días dentro del chat: "Hoy", "Ayer" o "3 de nov."
export const formatDay = (date: Date) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (sameDay(date, new Date())) return "Hoy";
  if (sameDay(date, yesterday)) return "Ayer";
  return `${date.getDate()} de ${MONTHS[date.getMonth()]}.`;
};

// Para la lista: la hora si fue hoy, "Ayer", o la fecha corta ("3 de nov.").
export const formatChatDate = (date: Date) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (sameDay(date, new Date())) return formatMessageTime(date);
  if (sameDay(date, yesterday)) return "Ayer";
  return `${date.getDate()} de ${MONTHS[date.getMonth()]}.`;
};
