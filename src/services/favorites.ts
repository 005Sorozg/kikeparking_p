// Colecciones de favoritos ficticias (se reemplazan por la API más adelante).
export interface FavoriteCollection {
  id: string;
  titulo: string;
  // Texto fijo ("Hace 1 semana") o cantidad de parqueaderos guardados.
  subtitulo?: string;
  guardados?: number;
}

export const favoriteCollections: FavoriteCollection[] = [
  { id: "1", titulo: "Vistos recientemente", subtitulo: "Hace 1 semana" },
  { id: "2", titulo: "Medellín 2026", guardados: 13 },
  { id: "3", titulo: "Santa Elena 2026", guardados: 10 },
  { id: "4", titulo: "Laureles 2026", guardados: 1 },
  { id: "5", titulo: "Belén 2026", guardados: 4 },
];
