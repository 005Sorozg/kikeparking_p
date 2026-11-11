import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import type { User } from "../context/AuthContext";

// Dónde se guarda la sesión:
// - Celular: SecureStore (llavero cifrado del sistema: Keychain en iOS, Keystore en Android).
// - Web: localStorage, porque SecureStore no existe en el navegador.
const SESSION_KEY = "kikeparking.session";

export interface Session {
  token: string;
  user: User;
}

async function write(value: string | null): Promise<void> {
  if (Platform.OS === "web") {
    try {
      if (value === null) localStorage.removeItem(SESSION_KEY);
      else localStorage.setItem(SESSION_KEY, value);
    } catch {
      // Modo incógnito o almacenamiento bloqueado: la sesión dura hasta recargar.
    }
    return;
  }

  if (value === null) await SecureStore.deleteItemAsync(SESSION_KEY);
  else await SecureStore.setItemAsync(SESSION_KEY, value);
}

async function read(): Promise<string | null> {
  if (Platform.OS === "web") {
    try {
      return localStorage.getItem(SESSION_KEY);
    } catch {
      return null;
    }
  }

  return SecureStore.getItemAsync(SESSION_KEY);
}

// Lee la fecha de expiración ("exp", en segundos) que el backend pone dentro del token.
// Solo se usa para no entrar con un token vencido; quien de verdad valida es el backend.
function tokenExpired(token: string): boolean {
  try {
    // El token viene en "base64url": se pasa a base64 normal y se completa el relleno "="
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const { exp } = JSON.parse(atob(payload)) as { exp?: number };
    return typeof exp === "number" && exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export async function saveSession(session: Session): Promise<void> {
  await write(JSON.stringify(session));
}

export async function clearSession(): Promise<void> {
  await write(null);
}

// Devuelve la sesión guardada si existe y el token no ha vencido.
export async function readSession(): Promise<Session | null> {
  try {
    const saved = await read();
    if (!saved) return null;

    const session = JSON.parse(saved) as Session;
    if (!session.token || !session.user || tokenExpired(session.token)) {
      await clearSession();
      return null;
    }

    return session;
  } catch {
    return null;
  }
}