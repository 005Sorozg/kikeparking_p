import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import type { Parqueadero } from "../services/parking";
import {
  agregarFavorito,
  obtenerFavoritos,
  quitarFavorito,
} from "../services/favorites";

interface FavoritesContextValue {
  // Parqueaderos guardados, del más reciente al más antiguo
  favoritos: Parqueadero[];
  // false mientras se cargan por primera vez
  cargados: boolean;
  error: string | null;
  esFavorito: (id: string) => boolean;
  alternarFavorito: (parqueadero: Parqueadero) => Promise<void>;
  recargar: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

// Comparte los favoritos entre Explorar, el detalle y la pestaña Favoritos:
// si se marca el corazón en una pantalla, las demás se enteran sin recargar.
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { usuario, token } = useAuth();
  const esConductor = usuario?.role === "conductor";
  const [favoritos, setFavoritos] = useState<Parqueadero[]>([]);
  const [cargados, setCargados] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    if (!token || !esConductor) return;

    try {
      setFavoritos(await obtenerFavoritos(token));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar los favoritos.");
    } finally {
      setCargados(true);
    }
  }, [token, esConductor]);

  // Al iniciar sesión se cargan; al cerrarla se vacían.
  useEffect(() => {
    setFavoritos([]);
    setCargados(false);
    recargar();
  }, [recargar]);

  const esFavorito = (id: string) => favoritos.some((p) => p.id === id);

  // El corazón cambia al instante; si el backend falla, se deshace el cambio.
  const alternarFavorito = async (parqueadero: Parqueadero) => {
    if (!token) return;

    const estaba = esFavorito(parqueadero.id);
    const anteriores = favoritos;

    setFavoritos(
      estaba
        ? favoritos.filter((p) => p.id !== parqueadero.id)
        : [parqueadero, ...favoritos],
    );

    try {
      if (estaba) await quitarFavorito(parqueadero.id, token);
      else await agregarFavorito(parqueadero.id, token);
    } catch {
      setFavoritos(anteriores);
    }
  };

  return (
    <FavoritesContext.Provider
      value={{ favoritos, cargados, error, esFavorito, alternarFavorito, recargar }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavoritos(): FavoritesContextValue {
  const contexto = useContext(FavoritesContext);

  if (!contexto) {
    throw new Error("useFavoritos debe usarse dentro de un FavoritesProvider");
  }

  return contexto;
}