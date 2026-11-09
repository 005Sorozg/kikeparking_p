import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { AppState } from "react-native";
import { useAuth } from "./AuthContext";
import { obtenerNoLeidos } from "../services/messages";

// Cada cuánto se revisa si llegaron mensajes nuevos mientras la app está abierta
const INTERVALO_MS = 20000;

interface UnreadContextValue {
  // Total de mensajes sin leer (el número rojo de la pestaña Mensajes)
  noLeidos: number;
  // Volver a preguntar ya (ej: después de abrir un chat)
  actualizar: () => Promise<void>;
}

const UnreadContext = createContext<UnreadContextValue | null>(null);

export function UnreadProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [noLeidos, setNoLeidos] = useState(0);

  const actualizar = useCallback(async () => {
    if (!token) return;
    try {
      setNoLeidos(await obtenerNoLeidos(token));
    } catch {
      // Si falla (ej: sin internet) se deja el número anterior y se reintenta luego
    }
  }, [token]);

  useEffect(() => {
    // Al cerrar sesión el contador vuelve a 0
    if (!token) {
      setNoLeidos(0);
      return;
    }

    actualizar();
    const temporizador = setInterval(() => {
      // Solo si la app está en pantalla: en segundo plano no se gasta datos ni batería
      if (AppState.currentState === "active") actualizar();
    }, INTERVALO_MS);

    // Al volver a la app se actualiza de inmediato
    const suscripcion = AppState.addEventListener("change", (estado) => {
      if (estado === "active") actualizar();
    });

    return () => {
      clearInterval(temporizador);
      suscripcion.remove();
    };
  }, [token, actualizar]);

  return (
    <UnreadContext.Provider value={{ noLeidos, actualizar }}>
      {children}
    </UnreadContext.Provider>
  );
}

export function useNoLeidos(): UnreadContextValue {
  const contexto = useContext(UnreadContext);

  if (!contexto) {
    throw new Error("useNoLeidos debe usarse dentro de un UnreadProvider");
  }

  return contexto;
}