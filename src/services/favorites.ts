import { apiRequest } from "./api";
import { Parqueadero, ParqueaderoApi, aParqueadero } from "./parking";

// GET /favorites (conductor): sus parqueaderos guardados, del más reciente al más antiguo.
export async function obtenerFavoritos(token: string): Promise<Parqueadero[]> {
  const datos = await apiRequest<ParqueaderoApi[]>("/favorites", { token });

  return datos.map(aParqueadero);
}

// PUT /favorites/:id: guardar (si ya estaba guardado, no pasa nada).
export async function agregarFavorito(id: string, token: string): Promise<void> {
  await apiRequest<void>(`/favorites/${id}`, { method: "PUT", token });
}

// DELETE /favorites/:id: quitar (si no estaba, tampoco pasa nada).
export async function quitarFavorito(id: string, token: string): Promise<void> {
  await apiRequest<void>(`/favorites/${id}`, { method: "DELETE", token });
}

export interface ColeccionFavoritos {
  barrio: string;
  parqueaderos: Parqueadero[];
}

// Agrupa los favoritos por barrio, en el orden en que aparece cada barrio
// (el del favorito más reciente primero).
export const agruparPorBarrio = (
  favoritos: Parqueadero[],
): ColeccionFavoritos[] => {
  const grupos = new Map<string, Parqueadero[]>();

  favoritos.forEach((p) => {
    grupos.set(p.barrio, [...(grupos.get(p.barrio) ?? []), p]);
  });

  return Array.from(grupos, ([barrio, parqueaderos]) => ({
    barrio,
    parqueaderos,
  }));
};