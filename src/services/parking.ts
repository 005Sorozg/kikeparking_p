import type { ImageSourcePropType } from "react-native";

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
