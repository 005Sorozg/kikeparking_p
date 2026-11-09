import * as Location from "expo-location";
import type { Ubicacion } from "./parking";

// Si el usuario no da permiso de ubicación, el mapa arranca en el centro de Medellín
export const UBICACION_POR_DEFECTO: Ubicacion = { lat: 6.2442, lng: -75.5812 };

// Pide permiso y devuelve dónde está el celular, o null si no dio permiso o falló.
export async function obtenerMiUbicacion(): Promise<Ubicacion | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return null;

    const posicion = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return { lat: posicion.coords.latitude, lng: posicion.coords.longitude };
  } catch {
    return null;
  }
}

// Convierte un punto del mapa en dirección y barrio (lo hace el celular, sin API key).
// Si no encuentra nada, devuelve campos vacíos y el propietario los escribe a mano.
export async function direccionDe(
  ubicacion: Ubicacion,
): Promise<{ direccion?: string; barrio?: string }> {
  try {
    const [lugar] = await Location.reverseGeocodeAsync({
      latitude: ubicacion.lat,
      longitude: ubicacion.lng,
    });
    if (!lugar) return {};

    const calle = [lugar.street, lugar.streetNumber].filter(Boolean).join(" ");

    return {
      direccion: calle || lugar.name || undefined,
      barrio: lugar.district || lugar.subregion || lugar.city || undefined,
    };
  } catch {
    return {};
  }
}