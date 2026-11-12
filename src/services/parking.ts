import type { ImageSourcePropType } from "react-native";
import { apiRequest, apiUploadFile } from "./api";

// Datos ficticios: más adelante se reemplazan por llamadas reales a la API.

export interface MockParkingSpot {
  id: string;
  title: string;
  neighborhood: string;
  city: string;
  address: string;
  distanceKm: number;
  vehicles: number;
  labels: string[];
  pricePerDay: number;
  available: boolean;
  rating: number;
  favorite: boolean;
  // Foto local por ahora; con el back será { uri: "https://..." }.
  image?: ImageSourcePropType;
}

export const QUICK_FILTERS = [
  "Techado",
  "Vigilancia 24/7",
  "Acceso rápido",
  "Cargador eléctrico",
];

export const formatPrice = (value: number) =>
  `$${value.toLocaleString("en-US")}`;

export const mockParkingSpots: MockParkingSpot[] = [
  {
    id: "1",
    image: require("../../assets/images/garaje-techado.jpeg"),
    title: "Garaje techado con vigilancia",
    neighborhood: "Laureles",
    city: "Medellín",
    address: "Cra. 76 #44-20",
    distanceKm: 1.2,
    vehicles: 1,
    labels: ["Techado", "Vigilancia 24/7"],
    pricePerDay: 50000,
    available: true,
    rating: 4.9,
    favorite: true,
  },
  {
    id: "2",
    image: require("../../assets/images/celda-unidad.jpg"),
    title: "Celda en unidad cerrada",
    neighborhood: "El Poblado",
    city: "Medellín",
    address: "Cl. 9 #37-15",
    distanceKm: 2.4,
    vehicles: 1,
    labels: ["Techado", "Acceso rápido"],
    pricePerDay: 65000,
    available: true,
    rating: 4.6,
    favorite: false,
  },
  {
    id: "3",
    image: require("../../assets/images/parqueadero-descubierto.jpg"),
    title: "Parqueadero descubierto",
    neighborhood: "Belén",
    city: "Medellín",
    address: "Cra. 70 #30-08",
    distanceKm: 3.1,
    vehicles: 2,
    labels: ["Acceso rápido"],
    pricePerDay: 35000,
    available: false,
    rating: 4.2,
    favorite: false,
  },
  {
    id: "4",
    image: require("../../assets/images/garaje-familiar.jpeg"),
    title: "Garaje familiar",
    neighborhood: "Envigado",
    city: "Antioquia",
    address: "Cl. 38 Sur #43-12",
    distanceKm: 5.8,
    vehicles: 1,
    labels: ["Vigilancia 24/7", "Cargador eléctrico"],
    pricePerDay: 48000,
    available: true,
    rating: 4.8,
    favorite: false,
  },

];


// ---------- Datos reales (API) ----------

// Foto de un parqueadero tal como la devuelve el backend.
export interface ParkingPhoto {
  id: number;
  url: string;
}

// Características que marca el propietario (también sirven de filtro en Explorar)
export interface Features {
  acceptsCars: boolean;
  acceptsMotorcycles: boolean;
  covered: boolean;
  security: boolean;
  cameras: boolean;
  evCharging: boolean;
}

// Las que trae un parqueadero nuevo si el propietario no cambia nada
export const INITIAL_FEATURES: Features = {
  acceptsCars: true,
  acceptsMotorcycles: true,
  covered: false,
  security: false,
  cameras: false,
  evCharging: false,
};

// Así se llaman en el backend
const toFeaturesApi = (c: Features) => ({
  acceptsCars: c.acceptsCars,
  acceptsMotorcycles: c.acceptsMotorcycles,
  covered: c.covered,
  hasSecurity: c.security,
  hasCameras: c.cameras,
  hasEvCharging: c.evCharging,
});

// Así responde el backend (GET /parking-spots).
export interface ParkingSpotApi {
  id: number;
  title: string;
  neighborhood: string;
  address: string;
  pricePerHour: number;
  available: boolean;
  rating: number;
  reviewCount: number;
  ownerId: number;
  photos: ParkingPhoto[];
  acceptsCars: boolean;
  acceptsMotorcycles: boolean;
  covered: boolean;
  hasSecurity: boolean;
  hasCameras: boolean;
  hasEvCharging: boolean;
  latitude: number | null;
  longitude: number | null;
  // Solo en /nearby
  distanceKm?: number;
  // Solo en el detalle (GET /parking-spots/:id)
  owner?: {
    id: number;
    name: string;
    avatarUrl: string | null;
    rating: number;
    reviewCount: number;
    parkingSpotCount: number;
    memberSince: string | null;
  };
}

// Dueño del parqueadero (solo viene en el detalle)
export interface ParkingSpotOwner {
  id: number;
  name: string;
  photo?: ImageSourcePropType;
  // Promedio de las reseñas de todos sus parqueaderos
  rating: number;
  reviewCount: number;
  parkingSpotCount: number;
  // Desde cuándo usa KikeParking
  memberSince: Date | null;
}

// Punto en el mapa
export interface Coordinates {
  lat: number;
  lng: number;
}

// Así los usan las pantallas.
export interface ParkingSpot {
  id: string;
  title: string;
  neighborhood: string;
  address: string;
  pricePerHour: number;
  available: boolean;
  rating: number;
  reviewCount: number;
  features: Features;
  // null si el propietario todavía no la marcó en el mapa
  location: Coordinates | null;
  // Solo cuando viene de "cercanos": a cuántos km está
  distanceKm?: number;
  ownerId: number;
  // Todas las fotos del parqueadero (máximo 5)
  photos: ParkingPhoto[];
  // Portada (la primera foto). Si no hay fotos queda vacía y se ve el ícono de imagen.
  image?: ImageSourcePropType;
  // Solo en el detalle
  owner?: ParkingSpotOwner;
}

// Cantidad máxima de fotos por parqueadero (la misma regla del backend)
export const MAX_PARKING_PHOTOS = 5;

export const toParkingSpot = (p: ParkingSpotApi): ParkingSpot => ({
  id: String(p.id),
  title: p.title,
  neighborhood: p.neighborhood,
  address: p.address,
  pricePerHour: p.pricePerHour,
  available: p.available,
  rating: p.rating,
  reviewCount: p.reviewCount ?? 0,
  features: {
    acceptsCars: p.acceptsCars ?? true,
    acceptsMotorcycles: p.acceptsMotorcycles ?? true,
    covered: p.covered ?? false,
    security: p.hasSecurity ?? false,
    cameras: p.hasCameras ?? false,
    evCharging: p.hasEvCharging ?? false,
  },
  location:
    p.latitude !== null && p.latitude !== undefined && p.longitude !== null && p.longitude !== undefined
      ? { lat: p.latitude, lng: p.longitude }
      : null,
  distanceKm: p.distanceKm,
  ownerId: p.ownerId,
  photos: p.photos ?? [],
  image: p.photos?.[0] ? { uri: p.photos[0].url } : undefined,
  owner: p.owner
    ? {
      id: p.owner.id,
      name: p.owner.name,
      photo: p.owner.avatarUrl ? { uri: p.owner.avatarUrl } : undefined,
      rating: p.owner.rating,
      reviewCount: p.owner.reviewCount,
      parkingSpotCount: p.owner.parkingSpotCount,
      memberSince: p.owner.memberSince ? new Date(p.owner.memberSince) : null,
    }
    : undefined,
});

export interface ParkingFilters {
  search?: string;
  onlyAvailable?: boolean;
  sort?: "rating" | "price";
  // Solo los que acepten este vehículo
  vehicle?: "carro" | "moto";
  // En true: solo los que tengan esa característica
  covered?: boolean;
  security?: boolean;
  cameras?: boolean;
  evCharging?: boolean;
  // Rectángulo del mapa: solo los que se ven en pantalla
  area?: { minLat: number; maxLat: number; minLng: number; maxLng: number };
}

// GET /parking-spots, con los filtros que el backend ya soporta.
export async function getParkingSpots(
  filters: ParkingFilters = {},
): Promise<ParkingSpot[]> {
  const params = new URLSearchParams();

  if (filters.search?.trim()) params.set("search", filters.search.trim());
  if (filters.onlyAvailable) params.set("onlyAvailable", "true");
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.vehicle) params.set("vehicle", filters.vehicle);
  if (filters.covered) params.set("covered", "true");
  if (filters.security) params.set("hasSecurity", "true");
  if (filters.cameras) params.set("hasCameras", "true");
  if (filters.evCharging) params.set("hasEvCharging", "true");
  if (filters.area) {
    params.set("minLat", String(filters.area.minLat));
    params.set("maxLat", String(filters.area.maxLat));
    params.set("minLng", String(filters.area.minLng));
    params.set("maxLng", String(filters.area.maxLng));
  }

  const query = params.toString();
  const data = await apiRequest<ParkingSpotApi[]>(
    `/parking-spots${query ? `?${query}` : ""}`,
  );

  return data.map(toParkingSpot);
}

// GET /parking-spots/nearby: los más cercanos a un punto, del más cerca al más lejos.
export async function getNearby(
  location: Coordinates,
  limit = 10,
): Promise<ParkingSpot[]> {
  const data = await apiRequest<ParkingSpotApi[]>(
    `/parking-spots/nearby?lat=${location.lat}&lng=${location.lng}&limit=${limit}`,
  );

  return data.map(toParkingSpot);
}

// GET /parking-spots/:id
export async function getParkingSpot(id: string): Promise<ParkingSpot> {
  const result = await apiRequest<ParkingSpotApi>(`/parking-spots/${id}`);

  return toParkingSpot(result);
}

// GET /parking-spots/mine (propietario): sus parqueaderos publicados.
export async function getMyParkingSpots(
  token: string,
): Promise<ParkingSpot[]> {
  const data = await apiRequest<ParkingSpotApi[]>("/parking-spots/mine", {
    token,
  });

  return data.map(toParkingSpot);
}

export interface ParkingSpotInput {
  title: string;
  neighborhood: string;
  address: string;
  pricePerHour: number;
  features?: Features;
  location?: Coordinates | null;
}

// POST /parking-spots (requiere sesión iniciada: el dueño sale del token).
export async function publishParkingSpot(
  data: ParkingSpotInput,
  token: string,
): Promise<ParkingSpot> {
  const result = await apiRequest<ParkingSpotApi>("/parking-spots", {
    method: "POST",
    token,
    body: {
      title: data.title,
      neighborhood: data.neighborhood,
      address: data.address,
      pricePerHour: data.pricePerHour,
      ...(data.features && toFeaturesApi(data.features)),
      ...(data.location && { latitude: data.location.lat, longitude: data.location.lng }),
    },
  });

  return toParkingSpot(result);
}

// PATCH /parking-spots/:id/availability (solo el dueño).
// disponible = false lo pausa: no recibe reservas nuevas, las que tenía se mantienen.
export async function changeAvailability(
  id: string,
  available: boolean,
  token: string,
): Promise<ParkingSpot> {
  const result = await apiRequest<ParkingSpotApi>(
    `/parking-spots/${id}/availability`,
    { method: "PATCH", token, body: { available } },
  );

  return toParkingSpot(result);
}

export async function editParkingSpot(
  id: string,
  data: Partial<ParkingSpotInput>,
  token: string,
): Promise<ParkingSpot> {
  const result = await apiRequest<ParkingSpotApi>(`/parking-spots/${id}`, {
    method: "PATCH",
    token,
    body: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.neighborhood !== undefined && { neighborhood: data.neighborhood }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.pricePerHour !== undefined && { pricePerHour: data.pricePerHour }),
      ...(data.features && toFeaturesApi(data.features)),
      ...(data.location && { latitude: data.location.lat, longitude: data.location.lng }),
    },
  });

  return toParkingSpot(result);
}

// POST /parking-spots/:id/photos (solo el dueño): sube UNA foto y devuelve
// el parqueadero con todas sus fotos.
export async function uploadParkingPhoto(
  id: string,
  uri: string,
  type: string | undefined,
  token: string,
): Promise<ParkingSpot> {
  const result = await apiUploadFile<ParkingSpotApi>(
    `/parking-spots/${id}/photos`,
    { token, field: "photo", uri, type },
  );

  return toParkingSpot(result);
}

// DELETE /parking-spots/:id/photos/:photoId (solo el dueño): borra una foto.
export async function deleteParkingPhoto(
  id: string,
  photoId: number,
  token: string,
): Promise<ParkingSpot> {
  const result = await apiRequest<ParkingSpotApi>(
    `/parking-spots/${id}/photos/${photoId}`,
    { method: "DELETE", token },
  );

  return toParkingSpot(result);
}