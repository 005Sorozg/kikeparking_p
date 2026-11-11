import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import type { ParkingSpot } from "../services/parking";
import {
  addFavorite,
  getFavorites,
  removeFavorite,
} from "../services/favorites";

interface FavoritesContextValue {
  // Parqueaderos guardados, del más reciente al más antiguo
  favorites: ParkingSpot[];
  // false mientras se cargan por primera vez
  loaded: boolean;
  error: string | null;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (parkingSpot: ParkingSpot) => Promise<void>;
  reload: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

// Comparte los favoritos entre Explorar, el detalle y la pestaña Favoritos:
// si se marca el corazón en una pantalla, las demás se enteran sin recargar.
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user: user, token } = useAuth();
  const isDriver = user?.role === "conductor";
  const [favorites, setFavorites] = useState<ParkingSpot[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!token || !isDriver) return;

    try {
      setFavorites(await getFavorites(token));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar los favoritos.");
    } finally {
      setLoaded(true);
    }
  }, [token, isDriver]);

  // Al iniciar sesión se cargan; al cerrarla se vacían.
  useEffect(() => {
    setFavorites([]);
    setLoaded(false);
    reload();
  }, [reload]);

  const isFavorite = (id: string) => favorites.some((p) => p.id === id);

  // El corazón cambia al instante; si el backend falla, se deshace el cambio.
  const toggleFavorite = async (parkingSpot: ParkingSpot) => {
    if (!token) return;

    const wasFavorite = isFavorite(parkingSpot.id);
    const past = favorites;

    setFavorites(
      wasFavorite
        ? favorites.filter((p) => p.id !== parkingSpot.id)
        : [parkingSpot, ...favorites],
    );

    try {
      if (wasFavorite) await removeFavorite(parkingSpot.id, token);
      else await addFavorite(parkingSpot.id, token);
    } catch {
      setFavorites(past);
    }
  };

  return (
    <FavoritesContext.Provider
      value={{ favorites, loaded, error, isFavorite, toggleFavorite, reload }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextValue {
  const context = useContext(FavoritesContext);

  if (!context) {
    throw new Error("useFavoritos debe usarse dentro de un FavoritesProvider");
  }

  return context;
}