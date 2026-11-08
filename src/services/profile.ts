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

// PATCH /users/me: cambia el nombre y/o el correo. Devuelve el usuario actualizado.
export function actualizarPerfil(
  datos: { name?: string; email?: string },
  token: string,
): Promise<Usuario> {
  return apiRequest<Usuario>("/users/me", {
    method: "PATCH",
    body: datos,
    token,
  });
}

// PATCH /users/me/password: exige la contraseña actual. No devuelve datos.
export async function cambiarPassword(
  actual: string,
  nueva: string,
  token: string,
): Promise<void> {
  await apiRequest<{ message: string }>("/users/me/password", {
    method: "PATCH",
    body: { currentPassword: actual, newPassword: nueva },
    token,
  });
}