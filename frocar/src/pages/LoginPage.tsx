import { useState } from "react";
import { motion } from "framer-motion";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext"; // Importujemy useTheme

const LoginPage = () => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { theme } = useTheme(); // Pobieramy aktualny motyw

  // Dynamiczne kolory w zależności od motywu
  const backgroundColor = theme === "dark" ? "#1a1a1a" : "transparent";
  const cardBackgroundColor = theme === "dark" ? "#2d2d2d" : "#ffffff";
  const textColor = theme === "dark" ? "#e0e0e0" : "#000000";
  const buttonColor = theme === "dark" ? "btn-outline-light" : "btn-success";
  const errorColor = theme === "dark" ? "alert-dark" : "alert-danger";
  const borderColor = theme === "dark" ? "#444" : "#ced4da"; // Subtelna granica w dark mode

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setServerError("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("https://localhost:5001/api/account/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        setServerError(data.message || "Niepoprawne dane logowania.");
        return;
      }

      const data = await response.json();
      login(data.token, rememberMe);
      navigate("/");
    } catch (error) {
      setServerError("Błąd połączenia z serwerem.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center vh-100"
      style={{ background: backgroundColor }}
    >
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="card shadow-lg p-4 rounded"
        style={{ width: "400px", backgroundColor: cardBackgroundColor, color: textColor }}
      >
        <h2 className="text-center mb-4" style={{ color: textColor }}>
          Logowanie
        </h2>
        {serverError && (
          <div className={`alert ${errorColor}`} style={{ color: textColor }}>
            {serverError}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label" style={{ color: textColor }}>
              Nazwa użytkownika
            </label>
            <input
              type="text"
              name="username"
              className="form-control rounded-pill"
              style={{
                backgroundColor: theme === "dark" ? "#3d3d3d" : "#ffffff",
                color: textColor,
                borderColor: borderColor,
              }}
              placeholder="Wpisz nazwę użytkownika"
              value={formData.username}
              onChange={handleChange}
            />
          </div>

          <div className="mb-3">
            <label className="form-label" style={{ color: textColor }}>
              Hasło
            </label>
            <input
              type="password"
              name="password"
              className="form-control rounded-pill"
              style={{
                backgroundColor: theme === "dark" ? "#3d3d3d" : "#ffffff",
                color: textColor,
                borderColor: borderColor,
              }}
              placeholder="Wpisz hasło"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <div className="form-check form-switch mb-3 d-flex align-items-center">
            <input
              className="form-check-input custom-switch"
              type="checkbox"
              role="switch"
              id="rememberMe"
              checked={rememberMe}
              onChange={() => setRememberMe(!rememberMe)}
              style={{ backgroundColor: theme === "dark" ? "#444" : "#ced4da" }}
            />
            <label
              className="form-check-label ms-2"
              htmlFor="rememberMe"
              style={{ color: textColor }}
            >
              Zapamiętaj mnie
            </label>
          </div>

          <motion.button
            type="submit"
            className={`btn ${buttonColor} w-100 rounded-pill`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={loading}
          >
            {loading ? "Logowanie..." : "Zaloguj się"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default LoginPage;