import type { Usuario } from "../context/AuthContext";
import { apiRequest, apiUploadFile } from "./api";

// POST /users/me/avatar: sube la foto de perfil y devuelve el usuario actualizado.
export function subirAvatar(
  uri: string,
  tipo: string | undefined,
  token: string,
): Promise<Usuario> {
  return apiUploadFile<Usuario>("/users/me/avatar", {
    token,
    campo: "avatar",
    uri,
    tipo,
  });
}

// DELETE /users/me/avatar: quita la foto; la app vuelve a mostrar el ícono de persona.
export function quitarAvatar(token: string): Promise<Usuario> {
  return apiRequest<Usuario>("/users/me/avatar", { method: "DELETE", token });
}