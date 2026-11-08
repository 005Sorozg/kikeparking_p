import type { ImageSourcePropType } from "react-native";
import { apiRequest, apiUploadFile } from "./api";

// Datos ficticios: más adelante se reemplazan por llamadas reales a la API.

export interface ParkingSpot {
  id: string;
  titulo: string;
  barrio: string;
  ciudad: string;
  direccion: string;
  distanciaKm: number;
  vehiculos: number;
  etiquetas: string[];
  precioDia: number;
  disponible: boolean;
  calificacion: number;
  favorito: boolean;
  // Foto local por ahora; con el back será { uri: "https://..." }.
  imagen?: ImageSourcePropType;
}

export const FILTROS_RAPIDOS = [
  "Techado",
  "Vigilancia 24/7",
  "Acceso rápido",
  "Cargador eléctrico",
];

export const formatearPrecio = (valor: number) =>
  `$${valor.toLocaleString("en-US")}`;

export const parkingSpots: ParkingSpot[] = [
  {
    id: "1",
    imagen: require("../../assets/images/garaje-techado.jpeg"),
    titulo: "Garaje techado con vigilancia",
    barrio: "Laureles",
    ciudad: "Medellín",
    direccion: "Cra. 76 #44-20",
    distanciaKm: 1.2,
    vehiculos: 1,
    etiquetas: ["Techado", "Vigilancia 24/7"],
    precioDia: 50000,
    disponible: true,
    calificacion: 4.9,
    favorito: true,
  },
  {
    id: "2",
    imagen: require("../../assets/images/celda-unidad.jpg"),
    titulo: "Celda en unidad cerrada",
    barrio: "El Poblado",
    ciudad: "Medellín",
    direccion: "Cl. 9 #37-15",
    distanciaKm: 2.4,
    vehiculos: 1,
    etiquetas: ["Techado", "Acceso rápido"],
    precioDia: 65000,
    disponible: true,
    calificacion: 4.6,
    favorito: false,
  },
  {
    id: "3",
    imagen: require("../../assets/images/parqueadero-descubierto.jpg"),
    titulo: "Parqueadero descubierto",
    barrio: "Belén",
    ciudad: "Medellín",
    direccion: "Cra. 70 #30-08",
    distanciaKm: 3.1,
    vehiculos: 2,
    etiquetas: ["Acceso rápido"],
    precioDia: 35000,
    disponible: false,
    calificacion: 4.2,
    favorito: false,
  },
  {
    id: "4",
    imagen: require("../../assets/images/garaje-familiar.jpeg"),
    titulo: "Garaje familiar",
    barrio: "Envigado",
    ciudad: "Antioquia",
    direccion: "Cl. 38 Sur #43-12",
    distanciaKm: 5.8,
    vehiculos: 1,
    etiquetas: ["Vigilancia 24/7", "Cargador eléctrico"],
    precioDia: 48000,
    disponible: true,
    calificacion: 4.8,
    favorito: false,
  },
  
];


// ---------- Datos reales (API) ----------

// Foto de un parqueadero tal como la devuelve el backend.
export interface FotoParqueadero {
  id: number;
  url: string;
}

// Así responde el backend (GET /parking-spots).
export interface ParqueaderoApi {
  id: number;
  title: string;
  neighborhood: string;
  address: string;
  pricePerHour: number;
  available: boolean;
  rating: number;
  ownerId: number;
  photos: FotoParqueadero[];
}

// Así los usan las pantallas.
export interface Parqueadero {
  id: string;
  titulo: string;
  barrio: string;
  direccion: string;
  precioHora: number;
  disponible: boolean;
  calificacion: number;
  propietarioId: number;
  // Todas las fotos del parqueadero (máximo 5)
  fotos: FotoParqueadero[];
  // Portada (la primera foto). Si no hay fotos queda vacía y se ve el ícono de imagen.
  imagen?: ImageSourcePropType;
}

// Cantidad máxima de fotos por parqueadero (la misma regla del backend)
export const MAX_FOTOS_PARQUEADERO = 5;

export const aParqueadero = (p: ParqueaderoApi): Parqueadero => ({
  id: String(p.id),
  titulo: p.title,
  barrio: p.neighborhood,
  direccion: p.address,
  precioHora: p.pricePerHour,
  disponible: p.available,
  calificacion: p.rating,
  propietarioId: p.ownerId,
  fotos: p.photos ?? [],
  imagen: p.photos?.[0] ? { uri: p.photos[0].url } : undefined,
});

export interface FiltrosParqueaderos {
  busqueda?: string;
  soloDisponibles?: boolean;
  orden?: "rating" | "price";
}

// GET /parking-spots, con los filtros que el backend ya soporta.
export async function obtenerParqueaderos(
  filtros: FiltrosParqueaderos = {},
): Promise<Parqueadero[]> {
  const params = new URLSearchParams();

  if (filtros.busqueda?.trim()) params.set("search", filtros.busqueda.trim());
  if (filtros.soloDisponibles) params.set("onlyAvailable", "true");
  if (filtros.orden) params.set("sort", filtros.orden);

  const consulta = params.toString();
  const datos = await apiRequest<ParqueaderoApi[]>(
    `/parking-spots${consulta ? `?${consulta}` : ""}`,
  );

  return datos.map(aParqueadero);
}

// GET /parking-spots/:id
export async function obtenerParqueadero(id: string): Promise<Parqueadero> {
  const dato = await apiRequest<ParqueaderoApi>(`/parking-spots/${id}`);

  return aParqueadero(dato);
}

// GET /parking-spots/mine (propietario): sus parqueaderos publicados.
export async function obtenerMisParqueaderos(
  token: string,
): Promise<Parqueadero[]> {
  const datos = await apiRequest<ParqueaderoApi[]>("/parking-spots/mine", {
    token,
  });

  return datos.map(aParqueadero);
}

export interface DatosParqueadero {
  titulo: string;
  barrio: string;
  direccion: string;
  precioHora: number;
}

// POST /parking-spots (requiere sesión iniciada: el dueño sale del token).
export async function publicarParqueadero(
  datos: DatosParqueadero,
  token: string,
): Promise<Parqueadero> {
  const dato = await apiRequest<ParqueaderoApi>("/parking-spots", {
    method: "POST",
    token,
    body: {
      title: datos.titulo,
      neighborhood: datos.barrio,
      address: datos.direccion,
      pricePerHour: datos.precioHora,
    },
  });

  return aParqueadero(dato);
}

// PATCH /parking-spots/:id/availability (solo el dueño).
// disponible = false lo pausa: no recibe reservas nuevas, las que tenía se mantienen.
export async function cambiarDisponibilidad(
  id: string,
  disponible: boolean,
  token: string,
): Promise<Parqueadero> {
  const dato = await apiRequest<ParqueaderoApi>(
    `/parking-spots/${id}/availability`,
    { method: "PATCH", token, body: { available: disponible } },
  );

  return aParqueadero(dato);
}

export async function editarParqueadero(
  id: string,
  datos: Partial<DatosParqueadero>,
  token: string,
): Promise<Parqueadero> {
  const dato = await apiRequest<ParqueaderoApi>(`/parking-spots/${id}`, {
    method: "PATCH",
    token,
    body: {
      ...(datos.titulo !== undefined && { title: datos.titulo }),
      ...(datos.barrio !== undefined && { neighborhood: datos.barrio }),
      ...(datos.direccion !== undefined && { address: datos.direccion }),
      ...(datos.precioHora !== undefined && { pricePerHour: datos.precioHora }),
    },
  });

  return aParqueadero(dato);
}

// POST /parking-spots/:id/photos (solo el dueño): sube UNA foto y devuelve
// el parqueadero con todas sus fotos.
export async function subirFotoParqueadero(
  id: string,
  uri: string,
  tipo: string | undefined,
  token: string,
): Promise<Parqueadero> {
  const dato = await apiUploadFile<ParqueaderoApi>(
    `/parking-spots/${id}/photos`,
    { token, campo: "photo", uri, tipo },
  );

  return aParqueadero(dato);
}

// DELETE /parking-spots/:id/photos/:photoId (solo el dueño): borra una foto.
export async function borrarFotoParqueadero(
  id: string,
  fotoId: number,
  token: string,
): Promise<Parqueadero> {
  const dato = await apiRequest<ParqueaderoApi>(
    `/parking-spots/${id}/photos/${fotoId}`,
    { method: "DELETE", token },
  );

  return aParqueadero(dato);
}