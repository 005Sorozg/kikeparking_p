import { conversations } from "./messages";

// Mensajes ficticios de cada conversación (se reemplazan por la API más adelante).
export interface ChatMessage {
  id: string;
  texto: string;
  // "yo" = mensaje enviado por el usuario.
  autor: "yo" | "otro";
  hora: string;
}

const base: Record<string, ChatMessage[]> = {
  "1": [
    { id: "1", autor: "otro", texto: "Hola, ya quedó confirmado el garaje para el 1 de mayo.", hora: "9:12 a. m." },
    { id: "2", autor: "yo", texto: "Perfecto, llego sobre las 8 de la mañana.", hora: "9:15 a. m." },
    { id: "3", autor: "otro", texto: "Dale, gracias", hora: "9:16 a. m." },
  ],
  "2": [
    { id: "1", autor: "yo", texto: "Muchas gracias por el espacio, todo muy bien.", hora: "4:40 p. m." },
    { id: "2", autor: "otro", texto: "Es con mucho gusto, Juan", hora: "4:52 p. m." },
  ],
  "3": [
    { id: "1", autor: "otro", texto: "Recuerda que la entrada es por el portón azul.", hora: "10:05 a. m." },
    { id: "2", autor: "yo", texto: "Muchas gracias", hora: "10:07 a. m." },
  ],
  "4": [
    { id: "1", autor: "otro", texto: "¿Vamos a la reserva de mañana?", hora: "7:30 p. m." },
    { id: "2", autor: "yo", texto: "Jijijiji", hora: "7:32 p. m." },
  ],
};

export const mensajesDe = (conversationId: string): ChatMessage[] =>
  base[conversationId] ?? [];

export const tituloDe = (conversationId: string) =>
  conversations.find((c) => c.id === conversationId)?.titulo ?? "Chat";
