// URL de la API. Se toma de EXPO_PUBLIC_API_URL (archivo .env.local); si no existe,
// se usa el backend local. Ejemplos:
// - Navegador:          http://localhost:3000/kikeparking-api/v1
// - Celular (Expo Go):  http://192.168.1.10:3000/kikeparking-api/v1  (IP de tu PC)
// - Servidor (Render):  https://kikeparking-api.onrender.com/kikeparking-api/v1
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000/kikeparking-api/v1";

// Error con el mensaje que explica el backend (ej: "Correo o contraseña incorrectos").
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string,
  ) {
    super(message);
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH";
  body?: unknown;
  token?: string | null;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    // fetch solo falla así cuando no hay conexión con el servidor
    throw new ApiError("No se pudo conectar con el servidor.", 0);
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      data?.message ?? "Ocurrió un error inesperado.",
      response.status,
      data?.code,
    );
  }

  return data as T;
}