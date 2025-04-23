import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import "bootstrap/dist/css/bootstrap.min.css";
import Cookies from "js-cookie";
import { useThemeStyles } from "../styles/useThemeStyles";
import { FaCar, FaRedo, FaTimes, FaInfoCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

interface CarListing {
  brand: string;
  carType: string;
  rentalPricePerDay: number;
  
}

interface Rental {
  id: number;
  carListing: CarListing;
  rentalStartDate: string;
  rentalEndDate: string;
  
}

const RentalsPage = () => {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const {
    theme,
    backgroundColor,
    cardBackgroundColor,
    textColor,
    errorColor,
    buttonColor,
    buttonBackgroundColor,
    buttonBorderColor,
  } = useThemeStyles();

  const fetchRentals = async () => {
    setLoading(true);
    setServerError("");

    const token = Cookies.get("token");
    if (!token) {
      setServerError("Brak tokena. Zaloguj się ponownie.");
      setLoading(false);
      navigate("/login");
      return;
    }

    try {
      const response = await fetch("https://localhost:5001/api/CarRental/user", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Błąd podczas pobierania wypożyczeń.");
      }

      const data = await response.json();
      setRentals(data);
      if (data.length === 0) {
        setServerError("Brak wypożyczeń dla tego użytkownika.");
      }
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : "Błąd połączenia z serwerem."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRentals();
  }, [navigate]);

  const handleRetry = () => {
    fetchRentals();
  };

  const handleViewDetails = (rentalId: number) => {
    navigate(`/rentals/${rentalId}`);
  };

  const handleCancelRental = (rentalId: number) => {
    alert(`Anulowanie wypożyczenia o ID: ${rentalId} (funkcjonalność do zaimplementowania)`);
  };

  return (
    <div
      className={`d-flex flex-column align-items-center min-vh-100 theme-${theme} py-5`}
      style={{ backgroundColor }}
    >
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="card shadow-lg p-4 rounded w-100"
        style={{
          maxWidth: "800px",
          backgroundColor: cardBackgroundColor,
          color: textColor,
        }}
      >
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="text-center mb-0" style={{ color: textColor }}>
            Moje wypożyczenia
          </h2>
          <motion.button
            onClick={fetchRentals}
            className={`btn ${buttonColor} rounded-pill text-white`}
            style={{
              backgroundColor: buttonBackgroundColor,
              border:
                theme === "dark" ? `2px solid ${buttonBorderColor}` : undefined,
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={loading}
          >
            <FaRedo className="me-2" />
            Odśwież
          </motion.button>
        </div>

        {serverError && (
          <div className={`alert ${errorColor} text-center mb-3 d-flex justify-content-between align-items-center`}>
            <span>{serverError}</span>
            {serverError !== "Brak wypożyczeń dla tego użytkownika." && (
              <motion.button
                onClick={handleRetry}
                className={`btn btn-sm ${buttonColor} text-white`}
                style={{
                  backgroundColor: buttonBackgroundColor,
                  border:
                    theme === "dark"
                      ? `2px solid ${buttonBorderColor}`
                      : undefined,
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Spróbuj ponownie
              </motion.button>
            )}
          </div>
        )}

        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border" role="status" style={{ color: textColor }}>
              <span className="visually-hidden">Ładowanie...</span>
            </div>
            <p className="mt-2" style={{ color: textColor }}>Ładowanie...</p>
          </div>
        ) : rentals.length === 0 ? null : (
          <div className="list-group">
            {rentals.map((rental) => (
              <motion.div
                key={rental.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                className="list-group-item mb-3 rounded d-flex justify-content-between align-items-center"
                style={{
                  backgroundColor:
                    theme === "dark" ? "#343a40" : "#f8f9fa",
                  color: textColor,
                  border: "none",
                }}
                whileHover={{ scale: 1.02, backgroundColor: theme === "dark" ? "#3e444a" : "#e9ecef" }}
              >
                <div className="d-flex align-items-center">
                  <FaCar className="me-3" style={{ color: textColor, fontSize: "1.5em" }} />
                  <div>
                    <h5 className="mb-1" style={{ color: textColor }}>
                      {rental.carListing.brand} ({rental.carListing.carType})
                    </h5>
                    <p className="mb-1" style={{ color: textColor }}>
                      Od: {new Date(rental.rentalStartDate).toLocaleDateString("pl-PL", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}{" "}
                      Do: {new Date(rental.rentalEndDate).toLocaleDateString("pl-PL", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </p>
                    <p className="mb-0" style={{ color: textColor }}>
                      Cena za dzień: {rental.carListing.rentalPricePerDay} zł
                    </p>
                  </div>
                </div>
                <div>
                  <motion.button
                    onClick={() => handleViewDetails(rental.id)}
                    className={`btn btn-sm ${buttonColor} me-2 text-white`}
                    style={{
                      backgroundColor: buttonBackgroundColor,
                      border:
                        theme === "dark"
                          ? `2px solid ${buttonBorderColor}`
                          : undefined,
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaInfoCircle className="me-1" />
                    Szczegóły
                  </motion.button>
                  <motion.button
                    onClick={() => handleCancelRental(rental.id)}
                    className="btn btn-sm btn-danger text-white"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaTimes className="me-1" />
                    Anuluj
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default RentalsPage;