import React, { createContext, ReactNode, useContext, useState } from "react";
import { apiRequest } from "../services/api";

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

  const iniciarSesion = async (email: string, password: string) => {
    const respuesta = await apiRequest<LoginResponse>("/users/login", {
      method: "POST",
      body: { email, password },
    });

    setUsuario(respuesta.user);
    setToken(respuesta.token);
  };

  // El registro no devuelve token, así que al terminar iniciamos sesión con los mismos datos.
  const registrar = async (datos: DatosRegistro) => {
    await apiRequest<Usuario>("/users/register", {
      method: "POST",
      body: datos,
    });

    await iniciarSesion(datos.email, datos.password);
  };

  const cerrarSesion = () => {
    setUsuario(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{ usuario, token, iniciarSesion, registrar, cerrarSesion }}
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