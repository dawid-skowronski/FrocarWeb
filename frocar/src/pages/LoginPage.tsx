import { useState } from "react";
import { motion } from "framer-motion";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";


const LoginPage = () => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

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
        style={{ background: "transparent" }} // Usuwamy bg-light i ustawiamy przezroczystość
      >
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="card shadow-lg p-4 rounded"
          style={{ width: "400px" }}
        >
          <h2 className="text-center text-success mb-4">Logowanie</h2>
          {serverError && <div className="alert alert-danger">{serverError}</div>}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Nazwa użytkownika</label>
              <input
                type="text"
                name="username"
                className="form-control rounded-pill"
                placeholder="Wpisz nazwę użytkownika"
                value={formData.username}
                onChange={handleChange}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Hasło</label>
              <input
                type="password"
                name="password"
                className="form-control rounded-pill"
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
              />
              <label className="form-check-label ms-2" htmlFor="rememberMe">
                Zapamiętaj mnie
              </label>
            </div>

            <motion.button
              type="submit"
              className="btn btn-success w-100 rounded-pill"
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