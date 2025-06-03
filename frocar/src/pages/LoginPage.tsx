import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { motion } from "framer-motion";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useThemeStyles } from "../styles/useThemeStyles";
import { FaEye, FaEyeSlash } from "react-icons/fa";

interface LoginFormData {
  username: string;
  password: string;
}

const API_URL = "https://localhost:5001/api/account/login";
const ERROR_MESSAGES: Record<string, string> = {
  "400": "Niepoprawne dane logowania. Sprawdź nazwę użytkownika i hasło.",
  "401": "Niepoprawne dane logowania. Sprawdź nazwę użytkownika i hasło.",
  "403": "Brak uprawnień do zalogowania.",
  "500": "Wystąpił problem po stronie serwera. Spróbuj ponownie później.",
  default: "Wystąpił nieoczekiwany błąd. Skontaktuj się z pomocą techniczną.",
};

const getErrorMessage = (error: any, context: string = "default"): string => {
  if (error instanceof Error) {
    try {
      const errorData = JSON.parse(error.message);
      return ERROR_MESSAGES[errorData.status] || ERROR_MESSAGES[context] || ERROR_MESSAGES.default;
    } catch {
      return ERROR_MESSAGES[error.message] || ERROR_MESSAGES[context] || ERROR_MESSAGES.default;
    }
  }
  return ERROR_MESSAGES[context] || ERROR_MESSAGES.default;
};

const LoginPage = () => {
  const [formData, setFormData] = useState<LoginFormData>({ username: "", password: "" });
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();
  const {
    theme,
    backgroundColor,
    cardBackgroundColor,
    textColor,
    buttonColor,
    borderColor,
    inputBackgroundColor,
    buttonBackgroundColor,
    buttonBorderColor,
  } = useThemeStyles();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setServerError("");
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setServerError("");

    if (!formData.username || !formData.password) {
      setServerError("Proszę podać nazwę użytkownika i hasło.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify({ status: response.status, message: errorData.message }));
      }

      const data = await response.json();
      login(data.token);
      navigate("/");
    } catch (error) {
      setServerError(getErrorMessage(error, "login"));
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    backgroundColor: inputBackgroundColor,
    color: textColor,
    borderColor,
    paddingRight: "40px",
  };

  const iconStyle: React.CSSProperties = {
    position: "absolute",
    top: "50%",
    right: "10px",
    transform: "translateY(-50%)",
    cursor: "pointer",
    color: textColor,
  };

  const getPrimaryButtonStyles = () => ({
    backgroundColor: buttonBackgroundColor,
    border: theme === "dark" ? `2px solid ${buttonBorderColor}` : undefined,
  });

  return (
    <div className={`d-flex justify-content-center align-items-center vh-100 theme-${theme}`} style={{ backgroundColor }}>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="card shadow-lg p-4 rounded"
        style={{ width: "400px", backgroundColor: cardBackgroundColor, color: textColor }}
      >
        <h2 className="text-center mb-4" style={{ color: textColor }}>Logowanie</h2>
        {serverError && (
          <div className={`alert ${serverError.includes("Sukces") ? "alert-success" : "alert-danger"} text-center mb-3 rounded-pill`}>
            {serverError}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label" style={{ color: textColor }}>Nazwa użytkownika</label>
            <input
              type="text"
              name="username"
              className="form-control rounded-pill"
              style={inputStyle}
              placeholder="Wpisz nazwę użytkownika"
              value={formData.username}
              onChange={handleChange}
              disabled={loading}
              aria-label="Nazwa użytkownika"
            />
          </div>
          <div className="mb-3 position-relative">
            <label className="form-label" style={{ color: textColor }}>Hasło</label>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              className="form-control rounded-pill"
              style={inputStyle}
              placeholder="Wpisz hasło"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              aria-label="Hasło"
            />
            <span
              style={iconStyle}
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Ukryj hasło" : "Pokaż hasło"}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          <motion.button
            type="submit"
            className={`btn ${buttonColor} w-100 rounded-pill text-white`}
            style={getPrimaryButtonStyles()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={loading}
            aria-label="Zaloguj się"
          >
            {loading ? "Logowanie..." : "Zaloguj się"}
          </motion.button>
        </form>
        <div className="text-center mt-3">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate("/request-password-reset");
            }}
            style={{ color: buttonColor, textDecoration: "underline" }}
            aria-label="Zapomniałeś hasła?"
          >
            Zapomniałeś hasła?
          </a>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;