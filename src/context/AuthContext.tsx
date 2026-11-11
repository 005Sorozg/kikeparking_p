import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { apiRequest, registerOnTokenRejected } from "../services/api";
import { clearSession, saveSession, readSession } from "../services/session";

export type Role = "conductor" | "propietario";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  // URL de la foto de perfil; si no tiene, la app muestra el ícono de persona
  avatarUrl?: string | null;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: Role;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  // true mientras se lee la sesión guardada al abrir la app
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  logout: () => void;
}

interface LoginResponse {
  user: User;
  token: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    setUser(null);
    setToken(null);
    clearSession();
  };

  // Al abrir la app: recuperar la sesión guardada, si existe y no ha vencido.
  useEffect(() => {
    readSession()
      .then((session) => {
        if (session) {
          setUser(session.user);
          setToken(session.token);
        }
      })
      .finally(() => setLoading(false));

    // Si el backend rechaza el token en cualquier pantalla, se cierra la sesión.
    registerOnTokenRejected(logout);
    return () => registerOnTokenRejected(null);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiRequest<LoginResponse>("/users/login", {
      method: "POST",
      body: { email, password },
    });

    setUser(response.user);
    setToken(response.token);
    await saveSession({ user: response.user, token: response.token });
  };

  // El registro no devuelve token, así que al terminar iniciamos sesión con los mismos datos.
  const register = async (data: RegisterData) => {
    await apiRequest<User>("/users/register", {
      method: "POST",
      body: data,
    });

    await login(data.email, data.password);
  };

  // Actualiza los datos del usuario (por ejemplo, su foto) y los guarda en la sesión
  const updateUser = async (created: User) => {
    setUser(created);

    if (token) {
      await saveSession({ user: created, token });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        updateUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }

  return context;
}