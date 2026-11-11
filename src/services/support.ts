import { apiRequest } from "./api";

export interface SupportRequest {
  id: number;
  subject: string;
  message: string;
  createdAt: string;
}

// POST /support-requests: envía un mensaje al equipo de soporte (cualquier rol).
export function sendSupportRequest(
  subject: string,
  message: string,
  token: string,
): Promise<SupportRequest> {
  return apiRequest<SupportRequest>("/support-requests", {
    method: "POST",
    body: { subject, message },
    token,
  });
}