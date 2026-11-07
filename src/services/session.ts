import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import type { Usuario } from "../context/AuthContext";

// Dónde se guarda la sesión:
// - Celular: SecureStore (llavero cifrado del sistema: Keychain en iOS, Keystore en Android).
// - Web: localStorage, porque SecureStore no existe en el navegador.
const CLAVE = "kikeparking.sesion";

export interface Sesion {
  token: string;
  usuario: Usuario;
}

async function escribir(valor: string | null): Promise<void> {
  if (Platform.OS === "web") {
    try {
      if (valor === null) localStorage.removeItem(CLAVE);
      else localStorage.setItem(CLAVE, valor);
    } catch {
      // Modo incógnito o almacenamiento bloqueado: la sesión dura hasta recargar.
    }
    return;
  }

  if (valor === null) await SecureStore.deleteItemAsync(CLAVE);
  else await SecureStore.setItemAsync(CLAVE, valor);
}

async function leer(): Promise<string | null> {
  if (Platform.OS === "web") {
    try {
      return localStorage.getItem(CLAVE);
    } catch {
      return null;
    }
  }

  return SecureStore.getItemAsync(CLAVE);
}

// Lee la fecha de expiración ("exp", en segundos) que el backend pone dentro del token.
// Solo se usa para no entrar con un token vencido; quien de verdad valida es el backend.
function tokenVencido(token: string): boolean {
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

export async function guardarSesion(sesion: Sesion): Promise<void> {
  await escribir(JSON.stringify(sesion));
}

export async function borrarSesion(): Promise<void> {
  await escribir(null);
}

// Devuelve la sesión guardada si existe y el token no ha vencido.
export async function leerSesion(): Promise<Sesion | null> {
  try {
    const guardada = await leer();
    if (!guardada) return null;

    const sesion = JSON.parse(guardada) as Sesion;
    if (!sesion.token || !sesion.usuario || tokenVencido(sesion.token)) {
      await borrarSesion();
      return null;
    }

    return sesion;
  } catch {
    return null;
  }
}