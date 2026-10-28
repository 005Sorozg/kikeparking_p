import type { ImageSourcePropType } from "react-native";

// Colecciones de favoritos ficticias (se reemplazan por la API más adelante).
export interface FavoriteCollection {
  id: string;
  titulo: string;
  // Texto fijo ("Hace 1 semana") o cantidad de parqueaderos guardados.
  subtitulo?: string;
  guardados?: number;
  imagen?: ImageSourcePropType;
}

export const favoriteCollections: FavoriteCollection[] = [
  { id: "1", titulo: "Vistos recientemente", subtitulo: "Hace 1 semana", imagen: require("../../assets/images/vistos-recientemente.jpg") },
  { id: "2", titulo: "Medellín 2026", guardados: 13, imagen: require("../../assets/images/medellin-2026.jpeg") },
  { id: "3", titulo: "Santa Elena 2026", guardados: 10, imagen: require("../../assets/images/santa-elena-2026.jpeg") },
  { id: "4", titulo: "Laureles 2026", guardados: 1, imagen: require("../../assets/images/laureles-2026.jpeg") },
  { id: "5", titulo: "Belén 2026", guardados: 4, imagen: require("../../assets/images/belen-2026.jpeg") },
];
