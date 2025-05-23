import { useState } from "react";
import { motion } from "framer-motion";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";
import { useThemeStyles } from "../styles/useThemeStyles";

const RequestPasswordResetPage = () => {
  const [email, setEmail] = useState("");
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { theme, backgroundColor, cardBackgroundColor, textColor, buttonColor, errorColor, borderColor, inputBackgroundColor, buttonBackgroundColor, buttonBorderColor } = useThemeStyles();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setServerError("");
    setSuccessMessage("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!email) {
        setServerError("Adres e-mail jest wymagany.");
        setLoading(false);
        return;
      }
      const response = await fetch("https://localhost:5001/api/account/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(email),
      });
      if (!response.ok) {
        const data = await response.json();
        setServerError(data.message || "Nie udało się wysłać prośby o reset hasła.");
        return;
      }
      const data = await response.json();
      setSuccessMessage(data.message || "Link do resetu hasła został wysłany na podany adres e-mail.");
      setEmail("");
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
        <h2 className="text-center mb-4" style={{ color: textColor }}>Resetowanie hasła</h2>
        {serverError && <div className={`alert ${errorColor} text-center mb-3`}>{serverError}</div>}
        {successMessage && <div className="alert alert-success text-center mb-3">{successMessage}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label" style={{ color: textColor }}>Adres e-mail</label>
            <input
              type="email"
              name="email"
              className="form-control rounded-pill"
              style={inputStyle}
              placeholder="Wpisz swój adres e-mail"
              value={email}
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
            {loading ? "Wysyłanie..." : "Wyślij link do resetu"}
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

export default RequestPasswordResetPage;