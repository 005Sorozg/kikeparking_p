// URL de la API. Se toma de EXPO_PUBLIC_API_URL (archivo .env.local); si no existe,
// se usa el backend local. Ejemplos:
// - Navegador:          http://localhost:3000/kikeparking-api/v1
// - Celular (Expo Go):  http://192.168.1.10:3000/kikeparking-api/v1  (IP de tu PC)
// - Servidor (Render):  https://kikeparking-api.onrender.com/kikeparking-api/v1
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000/kikeparking-api/v1";

// Qué hacer cuando el backend rechaza el token (vencido o inválido).
// Lo registra AuthContext para cerrar la sesión.
let onTokenRejected: (() => void) | null = null;

export function registerOnTokenRejected(fn: (() => void) | null) {
  onTokenRejected = fn;
}

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
  method?: "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
  body?: unknown;
  token?: string | null;
}

// Lee la respuesta del backend y lanza ApiError si algo salió mal.
async function readResponse<T>(
  response: Response,
  withToken: boolean,
): Promise<T> {
  const data = await response.json().catch(() => null);

  // 401 en una petición con token = la sesión ya no sirve (ej: el token venció)
  if (response.status === 401 && withToken) {
    onTokenRejected?.();
  }

  if (!response.ok) {
    throw new ApiError(
      data?.message ?? "Ocurrió un error inesperado.",
      response.status,
      data?.code,
    );
  }

  return data as T;
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

  return readResponse<T>(response, Boolean(options.token));
}

interface UploadOptions {
  token: string;
  // Nombre del campo que espera el backend ("avatar" o "photo")
  field: string;
  // Ruta local de la imagen que dejó el selector de la galería
  uri: string;
  type?: string;
  name?: string;
}

// Sube una imagen como formulario con archivo (multipart/form-data).
// Se usa XMLHttpRequest porque el fetch de las versiones nuevas de Expo no acepta
// el formato { uri, name, type } con el que React Native adjunta archivos.
export function apiUploadFile<T>(
  path: string,
  options: UploadOptions,
): Promise<T> {
  const formData = new FormData();

  // En React Native, un archivo se adjunta como un objeto con uri, name y type
  formData.append(options.field, {
    uri: options.uri,
    name: options.name ?? "foto.jpg",
    type: options.type ?? "image/jpeg",
  } as unknown as Blob);

  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open("POST", `${API_BASE_URL}${path}`);
    xhr.setRequestHeader("Authorization", `Bearer ${options.token}`);
    xhr.setRequestHeader("Accept", "application/json");
    // Margen amplio por si el servidor gratuito está despertando
    xhr.timeout = 60000;

    xhr.onload = () => {
      let data: { message?: string; code?: string } | null = null;

      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        data = null;
      }

      // 401 = la sesión ya no sirve (ej: el token venció)
      if (xhr.status === 401) {
        onTokenRejected?.();
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data as T);

        return;
      }

      reject(
        new ApiError(
          data?.message ?? "Ocurrió un error inesperado.",
          xhr.status,
          data?.code,
        ),
      );
    };

    xhr.onerror = () =>
      reject(new ApiError("No se pudo conectar con el servidor.", 0));
    xhr.ontimeout = () =>
      reject(new ApiError("El servidor tardó demasiado en responder.", 0));

    xhr.send(formData);
  });
}

  