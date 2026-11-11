import { apiRequest } from "./api";
import { ParkingSpot, ParkingSpotApi, toParkingSpot } from "./parking";

// GET /favorites (conductor): sus parqueaderos guardados, del más reciente al más antiguo.
export async function getFavorites(token: string): Promise<ParkingSpot[]> {
  const data = await apiRequest<ParkingSpotApi[]>("/favorites", { token });

  return data.map(toParkingSpot);
}

// PUT /favorites/:id: guardar (si ya estaba guardado, no pasa nada).
export async function addFavorite(id: string, token: string): Promise<void> {
  await apiRequest<void>(`/favorites/${id}`, { method: "PUT", token });
}

// DELETE /favorites/:id: quitar (si no estaba, tampoco pasa nada).
export async function removeFavorite(id: string, token: string): Promise<void> {
  await apiRequest<void>(`/favorites/${id}`, { method: "DELETE", token });
}

export interface FavoritesCollection {
  neighborhood: string;
  mockParkingSpots: ParkingSpot[];
}

// Agrupa los favoritos por barrio, en el orden en que aparece cada barrio
// (el del favorito más reciente primero).
export const groupByNeighborhood = (
  favorites: ParkingSpot[],
): FavoritesCollection[] => {
  const groups = new Map<string, ParkingSpot[]>();

  favorites.forEach((p) => {
    groups.set(p.neighborhood, [...(groups.get(p.neighborhood) ?? []), p]);
  });

  return Array.from(groups, ([neighborhood, mockParkingSpots]) => ({
    neighborhood,
    mockParkingSpots,
  }));
};