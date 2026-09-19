// Este archivo simula lo que en el futuro va a venir del backend en Express.
// Por ahora los datos son ficticios, pero la idea es que después se reemplace por una llamada real a la API.

export interface ParkingSpot {
  id: string;
  titulo: string;
  barrio: string;
  direccion: string;
  precioHora: number;
  disponible: boolean;
  calificacion: number;
}

export const parkingSpots: ParkingSpot[] = [
  {
    id: "1",
    titulo: "Garaje techado con vigilancia",
    barrio: "Laureles",
    direccion: "Cra. 76 #44-20",
    precioHora: 3000,
    disponible: true,
    calificacion: 4.9,
  },
  {
    id: "2",
    titulo: "Celda en unidad cerrada",
    barrio: "El Poblado",
    direccion: "Cl. 9 #37-15",
    precioHora: 3500,
    disponible: true,
    calificacion: 4.6,
  },
  {
    id: "3",
    titulo: "Parqueadero descubierto",
    barrio: "Belén",
    direccion: "Cra. 70 #30-08",
    precioHora: 2500,
    disponible: false,
    calificacion: 4.2,
  },
  {
    id: "4",
    titulo: "Garaje familiar",
    barrio: "Envigado",
    direccion: "Cl. 38 Sur #43-12",
    precioHora: 2800,
    disponible: true,
    calificacion: 4.8,
  },
];