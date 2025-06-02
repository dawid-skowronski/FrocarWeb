import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { motion } from "framer-motion";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useThemeStyles } from "../styles/useThemeStyles";

const LoginPage = () => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();
  const { theme, backgroundColor, cardBackgroundColor, textColor, buttonColor, errorColor, borderColor, inputBackgroundColor, buttonBackgroundColor, buttonBorderColor } = useThemeStyles();

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
      login(data.token);
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
        <div className="text-center mt-3">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate("/request-password-reset");
            }}
            style={{ color: buttonColor, textDecoration: "underline" }}
          >
            Zapomniałeś hasła?
          </a>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
