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
import { getUnreadCount } from "../services/messages";

// Cada cuánto se revisa si llegaron mensajes nuevos mientras la app está abierta
const INTERVAL_MS = 20000;

interface UnreadContextValue {
  // Total de mensajes sin leer (el número rojo de la pestaña Mensajes)
  unread: number;
  // Volver a preguntar ya (ej: después de abrir un chat)
  update: () => Promise<void>;
}

const UnreadContext = createContext<UnreadContextValue | null>(null);

export function UnreadProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [unread, setUnread] = useState(0);

  const update = useCallback(async () => {
    if (!token) return;
    try {
      setUnread(await getUnreadCount(token));
    } catch {
      // Si falla (ej: sin internet) se deja el número anterior y se reintenta luego
    }
  }, [token]);

  useEffect(() => {
    // Al cerrar sesión el contador vuelve a 0
    if (!token) {
      setUnread(0);
      return;
    }

    update();
    const timer = setInterval(() => {
      // Solo si la app está en pantalla: en segundo plano no se gasta datos ni batería
      if (AppState.currentState === "active") update();
    }, INTERVAL_MS);

    // Al volver a la app se actualiza de inmediato
    const subscription = AppState.addEventListener("change", (status) => {
      if (status === "active") update();
    });

    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [token, update]);

  return (
    <UnreadContext.Provider value={{ unread, update }}>
      {children}
    </UnreadContext.Provider>
  );
}

export function useUnread(): UnreadContextValue {
  const context = useContext(UnreadContext);

  if (!context) {
    throw new Error("useUnread debe usarse dentro de un UnreadProvider");
  }

  return context;
}