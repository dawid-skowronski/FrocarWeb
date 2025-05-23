import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useThemeStyles } from "../styles/useThemeStyles";

const ResetPasswordPage = () => {
  const [formData, setFormData] = useState({ newPassword: "", confirmPassword: "" });
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { theme, backgroundColor, cardBackgroundColor, textColor, buttonColor, errorColor, borderColor, inputBackgroundColor, buttonBackgroundColor, buttonBorderColor } = useThemeStyles();

  
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setServerError("Brak tokenu resetującego. Spróbuj ponownie wygenerować link.");
    }
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setServerError("");
    setSuccessMessage("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!token) {
        setServerError("Brak tokenu resetującego.");
        setLoading(false);
        return;
      }

      if (!formData.newPassword || !formData.confirmPassword) {
        setServerError("Nowe hasło i potwierdzenie hasła są wymagane.");
        setLoading(false);
        return;
      }

      if (formData.newPassword !== formData.confirmPassword) {
        setServerError("Hasła nie są zgodne.");
        setLoading(false);
        return;
      }

      const response = await fetch("https://localhost:5001/api/account/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: formData.newPassword }),
      });

      if (!response.ok) {
        const data = await response.json();
        setServerError(data.message || "Nie udało się zresetować hasła.");
        setLoading(false);
        return;
      }

      const data = await response.json();
      setSuccessMessage(data.message || "Hasło zostało zresetowane pomyślnie.");
      setFormData({ newPassword: "", confirmPassword: "" });

      
      setTimeout(() => navigate("/login"), 2000);
    } catch (error) {
      setServerError("Błąd połączenia z serwerem.");
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
        <h2 className="text-center mb-4" style={{ color: textColor }}>Resetuj hasło</h2>
        {serverError && <div className={`alert ${errorColor} text-center mb-3`}>{serverError}</div>}
        {successMessage && <div className="alert alert-success text-center mb-3">{successMessage}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label" style={{ color: textColor }}>Nowe hasło</label>
            <input
              type="password"
              name="newPassword"
              className="form-control rounded-pill"
              style={inputStyle}
              placeholder="Wpisz nowe hasło"
              value={formData.newPassword}
              onChange={handleChange}
            />
          </div>
          <div className="mb-3">
            <label className="form-label" style={{ color: textColor }}>Potwierdź hasło</label>
            <input
              type="password"
              name="confirmPassword"
              className="form-control rounded-pill"
              style={inputStyle}
              placeholder="Potwierdź nowe hasło"
              value={formData.confirmPassword}
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
            disabled={loading || !token}
          >
            {loading ? "Resetowanie..." : "Zresetuj hasło"}
          </motion.button>
        </form>
        <div className="text-center mt-3">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate("/login");
            }}
            style={{ color: buttonColor, textDecoration: "underline" }}
          >
            Powrót do logowania
          </a>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;