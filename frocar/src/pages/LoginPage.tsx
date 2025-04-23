import { useState } from "react";
import { motion } from "framer-motion";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useThemeStyles } from "../styles/useThemeStyles";

const LoginPage = () => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { theme, backgroundColor, cardBackgroundColor, textColor, buttonColor, errorColor, borderColor, inputBackgroundColor, switchColor, buttonBackgroundColor, buttonBorderColor } = useThemeStyles();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setServerError("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!formData.username || !formData.password) {
        setServerError("Nazwa użytkownika i hasło są wymagane.");
        setLoading(false);
        return;
      }
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
      login(data.token, rememberMe); // Wywołanie funkcji login z tokenem i rememberMe
      navigate("/");
    } catch (error) {
      setServerError("Błąd połączenia z serwerem.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    backgroundColor: inputBackgroundColor,
    color: textColor,
    borderColor,
  };

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
        {serverError && <div className={`alert ${errorColor} text-center mb-3`}>{serverError}</div>}
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
            />
          </div>
          <div className="mb-3">
            <label className="form-label" style={{ color: textColor }}>Hasło</label>
            <input
              type="password"
              name="password"
              className="form-control rounded-pill"
              style={inputStyle}
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
              style={{ backgroundColor: switchColor, borderColor: switchColor }}
            />
            <label className="form-check-label ms-2" htmlFor="rememberMe" style={{ color: textColor }}>Zapamiętaj mnie</label>
          </div>
          <motion.button
            type="submit"
            className={`btn ${buttonColor} w-100 rounded-pill text-white`}
            style={{
              backgroundColor: buttonBackgroundColor,
              border: theme === "dark" ? `2px solid ${buttonBorderColor}` : undefined,
            }}
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