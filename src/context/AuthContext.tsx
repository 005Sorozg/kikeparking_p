import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { apiRequest, registrarAlRechazarToken } from "../services/api";
import { borrarSesion, guardarSesion, leerSesion } from "../services/session";

export type Rol = "conductor" | "propietario";

export interface Usuario {
  id: number;
  name: string;
  email: string;
  role: Rol;
}

interface DatosRegistro {
  name: string;
  email: string;
  password: string;
  role: Rol;
}

interface AuthContextValue {
  usuario: Usuario | null;
  token: string | null;
  // true mientras se lee la sesión guardada al abrir la app
  cargando: boolean;
  iniciarSesion: (email: string, password: string) => Promise<void>;
  registrar: (datos: DatosRegistro) => Promise<void>;
  cerrarSesion: () => void;
}

interface LoginResponse {
  user: Usuario;
  token: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  const cerrarSesion = () => {
    setUsuario(null);
    setToken(null);
    borrarSesion();
  };

  // Al abrir la app: recuperar la sesión guardada, si existe y no ha vencido.
  useEffect(() => {
    leerSesion()
      .then((sesion) => {
        if (sesion) {
          setUsuario(sesion.usuario);
          setToken(sesion.token);
        }
      })
      .finally(() => setCargando(false));

    // Si el backend rechaza el token en cualquier pantalla, se cierra la sesión.
    registrarAlRechazarToken(cerrarSesion);
    return () => registrarAlRechazarToken(null);
  }, []);

  const iniciarSesion = async (email: string, password: string) => {
    const respuesta = await apiRequest<LoginResponse>("/users/login", {
      method: "POST",
      body: { email, password },
    });

    setUsuario(respuesta.user);
    setToken(respuesta.token);
    await guardarSesion({ usuario: respuesta.user, token: respuesta.token });
  };

  // El registro no devuelve token, así que al terminar iniciamos sesión con los mismos datos.
  const registrar = async (datos: DatosRegistro) => {
    await apiRequest<Usuario>("/users/register", {
      method: "POST",
      body: datos,
    });

    await iniciarSesion(datos.email, datos.password);
  };

  return (
    <AuthContext.Provider
      value={{ usuario, token, cargando, iniciarSesion, registrar, cerrarSesion }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const contexto = useContext(AuthContext);

  if (!contexto) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }

  return contexto;
}