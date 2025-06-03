import { useState } from "react";
import { motion } from "framer-motion";
import "bootstrap/dist/css/bootstrap.min.css";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import { useThemeStyles } from "../styles/useThemeStyles";

// Schemat walidacji z niestandardowym testem dla znaku @
const schema = yup.object().shape({
  username: yup.string().min(3, "Nazwa użytkownika musi mieć co najmniej 3 znaki").required("Nazwa użytkownika jest wymagana"),
  email: yup
    .string()
    .email("Podaj poprawny adres email")
    .test("has-at-symbol", "Uwzględnij znak '@' w adresie e-mail", (value) => {
      return typeof value === "string" && value.includes("@");
    })
    .required("Email jest wymagany"),
  password: yup
    .string()
    .min(8, "Hasło musi mieć co najmniej 8 znaków")
    .matches(/[A-Z]/, "Hasło musi zawierać co najmniej jedną wielką literę")
    .matches(/[0-9]/, "Hasło musi zawierać co najmniej jedną cyfrę")
    .matches(/[!@#$%^&*(),.?":{}|<>]/, "Hasło musi zawierać co najmniej jeden znak specjalny")
    .required("Hasło jest wymagane"),
  confirmPassword: yup.string().oneOf([yup.ref("password")], "Hasła muszą być identyczne").required("Potwierdzenie hasła jest wymagane"),
});

const RegisterPage = () => {
  const [formData, setFormData] = useState({ username: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { theme, backgroundColor, cardBackgroundColor, textColor, buttonColor, errorColor, inputBackgroundColor, borderColor, buttonBackgroundColor, buttonBorderColor } = useThemeStyles();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
    setServerError("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await schema.validate(formData, { abortEarly: false });
      setLoading(true);
      const response = await fetch("https://localhost:5001/api/account/register", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) {
        let errorMessage = data.message || "Wystąpił błąd podczas rejestracji.";
        if (data.message === "Username is already taken") errorMessage = "Nazwa użytkownika jest już zajęta.";
        else if (data.message === "Email is already in use") errorMessage = "Podany adres email jest już używany.";
        setServerError(errorMessage);
        return;
      }
      navigate("/Login");
    } catch (err: any) {
      if (err.inner) {
        const newErrors: { [key: string]: string } = {};
        err.inner.forEach((error: any) => (newErrors[error.path] = error.message));
        setErrors(newErrors);
      } else setServerError(err.message);
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
        <h2 className="text-center mb-4" style={{ color: textColor }}>Rejestracja</h2>
        {serverError && (
          <div
            className={`alert rounded-pill text-center`}
            style={{ backgroundColor: errorColor, color: textColor, fontSize: "0.9rem" }}
          >
            {serverError}
          </div>
        )}
        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-3">
            <label className="form-label" style={{ color: textColor }}>Nazwa użytkownika</label>
            <input
              type="text"
              name="username"
              className={`form-control rounded-pill ${errors.username ? "is-invalid" : ""}`}
              style={inputStyle}
              placeholder="Wpisz nazwę użytkownika"
              value={formData.username}
              onChange={handleChange}
            />
            {errors.username && (
              <div className="validation-error" style={{ color: errorColor, fontSize: "0.85rem", marginTop: "0.25rem" }}>
                {errors.username}
              </div>
            )}
          </div>
          <div className="mb-3">
            <label className="form-label" style={{ color: textColor }}>Email</label>
            <input
              type="email"
              name="email"
              className={`form-control rounded-pill ${errors.email ? "is-invalid" : ""}`}
              style={inputStyle}
              placeholder="Wpisz email"
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && (
              <div className="validation-error" style={{ color: errorColor, fontSize: "0.85rem", marginTop: "0.25rem" }}>
                {errors.email}
              </div>
            )}
          </div>
          <div className="mb-3">
            <label className="form-label" style={{ color: textColor }}>Hasło</label>
            <input
              type="password"
              name="password"
              className={`form-control rounded-pill ${errors.password ? "is-invalid" : ""}`}
              style={inputStyle}
              placeholder="Wpisz hasło"
              value={formData.password}
              onChange={handleChange}
            />
            {errors.password && (
              <div className="validation-error" style={{ color: errorColor, fontSize: "0.85rem", marginTop: "0.25rem" }}>
                {errors.password}
              </div>
            )}
          </div>
          <div className="mb-3">
            <label className="form-label" style={{ color: textColor }}>Potwierdź hasło</label>
            <input
              type="password"
              name="confirmPassword"
              className={`form-control rounded-pill ${errors.confirmPassword ? "is-invalid" : ""}`}
              style={inputStyle}
              placeholder="Powtórz hasło"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
            {errors.confirmPassword && (
              <div className="validation-error" style={{ color: errorColor, fontSize: "0.85rem", marginTop: "0.25rem" }}>
                {errors.confirmPassword}
              </div>
            )}
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
            {loading ? "Rejestracja..." : "Zarejestruj się"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default RegisterPage;