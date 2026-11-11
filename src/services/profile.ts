import type { User } from "../context/AuthContext";
import { apiRequest, apiUploadFile } from "./api";

// POST /users/me/avatar: sube la foto de perfil y devuelve el usuario actualizado.
export function uploadAvatar(
  uri: string,
  type: string | undefined,
  token: string,
): Promise<User> {
  return apiUploadFile<User>("/users/me/avatar", {
    token,
    field: "avatar",
    uri,
    type,
  });
}

// DELETE /users/me/avatar: quita la foto; la app vuelve a mostrar el ícono de persona.
export function removeAvatar(token: string): Promise<User> {
  return apiRequest<User>("/users/me/avatar", { method: "DELETE", token });

  
}

// PATCH /users/me: cambia el nombre y/o el correo. Devuelve el usuario actualizado.
export function updateProfile(
  data: { name?: string; email?: string },
  token: string,
): Promise<User> {
  return apiRequest<User>("/users/me", {
    method: "PATCH",
    body: data,
    token,
  });
}

// PATCH /users/me/password: exige la contraseña actual. No devuelve datos.
export async function changePassword(
  current: string,
  newPassword: string,
  token: string,
): Promise<void> {
  await apiRequest<{ message: string }>("/users/me/password", {
    method: "PATCH",
    body: { currentPassword: current, newPassword },
    token,
  });
}