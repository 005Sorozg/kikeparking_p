import { apiRequest } from "./api";

export interface SolicitudAyuda {
  id: number;
  subject: string;
  message: string;
  createdAt: string;
}

// POST /support-requests: envía un mensaje al equipo de soporte (cualquier rol).
export function enviarSolicitudAyuda(
  asunto: string,
  mensaje: string,
  token: string,
): Promise<SolicitudAyuda> {
  return apiRequest<SolicitudAyuda>("/support-requests", {
    method: "POST",
    body: { subject: asunto, message: mensaje },
    token,
  });
}