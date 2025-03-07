import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { isAuthenticated, logout } = useAuth();

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="navbar navbar-expand-lg navbar-light bg-white shadow-sm"
      style={{ height: "56px" }} // Ustawiamy stałą wysokość
    >
      <div className="container">
        <Link to="/" className="navbar-brand text-success fw-bold">
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
          <ul className="navbar-nav ms-auto">
            {!isAuthenticated ? (
              <>
                <li className="nav-item">
                  <Link to="/register" className="nav-link text-success">
                    Rejestracja
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/login" className="nav-link text-success">
                    Logowanie
                  </Link>
                </li>
              </>
            ) : (
              <li className="nav-item">
                <button onClick={logout} className="btn btn-danger rounded-pill">
                  Wyloguj się
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;