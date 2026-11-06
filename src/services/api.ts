// URL base del backend.
// - Navegador (npm run web): localhost funciona tal cual.
// - Celular con Expo Go: cambia "localhost" por la IP de tu PC en la red (ej: 192.168.43.100).
export const API_BASE_URL = "http://localhost:3000/kikeparking-api/v1";

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