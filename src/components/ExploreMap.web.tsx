import type { FiltrosParqueaderos } from "../services/parking";

// En la web no hay mapa (react-native-maps solo funciona en el celular).
// Este archivo reemplaza a ExploreMap.tsx cuando la app corre en el navegador.
export function ExploreMap(_: { filtros: FiltrosParqueaderos; onAbrir: (id: string) => void }) {
  return null;
}