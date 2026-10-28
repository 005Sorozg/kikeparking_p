// Conversaciones ficticias (se reemplazan por la API más adelante).
export type ConversationKind = "host" | "amigo";

export interface Conversation {
  id: string;
  tipo: ConversationKind;
  titulo: string;
  ultimoMensaje: string;
  detalle: string;
  fecha: string;
  esGrupo: boolean;
}

export const conversations: Conversation[] = [
  {
    id: "1",
    tipo: "host",
    titulo: "Fernando y 3 personas más",
    ultimoMensaje: "Samuel: Dale, gracias",
    detalle: "1 - 2 de may • Sabaneta",
    fecha: "03 de may.",
    esGrupo: true,
  },
  {
    id: "2",
    tipo: "host",
    titulo: "Victor, Carolina, Juan José",
    ultimoMensaje: "Victor: Es con mucho gusto, Juan",
    detalle: "18 - 19 de abr • Santa Elena",
    fecha: "19 de abr.",
    esGrupo: true,
  },
  {
    id: "3",
    tipo: "host",
    titulo: "Isabel Rueda y 2 personas más",
    ultimoMensaje: "Reaccionó con 👍 a “Muchas gracias”",
    detalle: "3 - 4 de feb • Medellín",
    fecha: "5 de feb.",
    esGrupo: true,
  },
  {
    id: "4",
    tipo: "amigo",
    titulo: "Juan Esteban",
    ultimoMensaje: "Tú: Jijijiji",
    detalle: "Mensaje directo",
    fecha: "28 de feb.",
    esGrupo: false,
  },
];
