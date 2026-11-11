import * as Location from "expo-location";
import type { Coordinates } from "./parking";

// Si el usuario no da permiso de ubicación, el mapa arranca en el centro de Medellín
export const DEFAULT_LOCATION: Coordinates = { lat: 6.2442, lng: -75.5812 };

// Pide permiso y devuelve dónde está el celular, o null si no dio permiso o falló.
export async function getMyLocation(): Promise<Coordinates | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return null;

    const coords = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return { lat: coords.coords.latitude, lng: coords.coords.longitude };
  } catch {
    return null;
  }
}

// Convierte un punto del mapa en dirección y barrio (lo hace el celular, sin API key).
// Si no encuentra nada, devuelve campos vacíos y el propietario los escribe a mano.
export async function reverseGeocode(
  location: Coordinates,
): Promise<{ address?: string; neighborhood?: string }> {
  try {
    const [place] = await Location.reverseGeocodeAsync({
      latitude: location.lat,
      longitude: location.lng,
    });
    if (!place) return {};

    const street = [place.street, place.streetNumber].filter(Boolean).join(" ");

    return {
      address: street || place.name || undefined,
      neighborhood: place.district || place.subregion || place.city || undefined,
    };
  } catch {
    return {};
  }
}