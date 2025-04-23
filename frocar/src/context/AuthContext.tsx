import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (token: string, rememberMe: boolean) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const navigate = useNavigate();

  // Sprawdzenie, czy token istnieje w ciasteczku przy ładowaniu komponentu
  useEffect(() => {
    const token = Cookies.get("token");
    setIsAuthenticated(!!token);
  }, []);

  // Funkcja logowania zapisująca token w ciasteczku
  const login = (token: string, rememberMe: boolean) => {
    const expires = rememberMe ? 7 : undefined; // 7 dni ważności, jeśli "Zapamiętaj mnie" jest włączone
    Cookies.set("token", token, { expires });
    setIsAuthenticated(true);
  };

  // Funkcja wylogowania usuwająca token z ciasteczka
  const logout = () => {
    Cookies.remove("token");
    setIsAuthenticated(false);
    navigate("/");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};