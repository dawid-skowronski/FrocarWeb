import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { FaSun, FaMoon } from "react-icons/fa"; // Ikony słońca i księżyca

const Navbar = () => {
  const { isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`navbar navbar-expand-lg shadow-sm ${
        theme === "dark" ? "bg-dark text-light" : "bg-white text-dark"
      }`}
      style={{ height: "56px" }}
    >
      <div className="container">
        <Link
          to="/"
          className={`navbar-brand fw-bold ${
            theme === "dark" ? "text-light" : "text-success"
          }`}
        >
          FroCar
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto align-items-center">
            {isAuthenticated ? (
              <>
                <li className="nav-item">
                </li>
                <li className="nav-item">
                  <Link
                    to="/profile"
                    className={`nav-link ${
                      theme === "dark" ? "text-light" : "text-success"
                    }`}
                  >
                    Profil
                  </Link>
                </li>
                <li className="nav-item">
                  <button onClick={logout} className="btn btn-danger rounded-pill">
                    Wyloguj się
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link
                    to="/register"
                    className={`nav-link ${
                      theme === "dark" ? "text-light" : "text-success"
                    }`}
                  >
                    Rejestracja
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/login"
                    className={`nav-link ${
                      theme === "dark" ? "text-light" : "text-success"
                    }`}
                  >
                    Logowanie
                  </Link>
                </li>
              </>
            )}
            {/* Przełącznik motywu */}
            <li className="nav-item">
              <button
                onClick={toggleTheme}
                className="btn btn-link nav-link"
                style={{ color: theme === "dark" ? "#f1c40f" : "#0c7b3e" }}
              >
                {theme === "dark" ? <FaSun size="1.5em" /> : <FaMoon size="1.5em" />}
              </button>
            </li>
          </ul>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;