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
  rentalStatus: string;
}

const API_URL = "https://localhost:5001";
const REFRESH_INTERVAL = 30000;
const ERROR_MESSAGES: Record<string, string> = {
  "401": "Sesja wygasła. Zaloguj się ponownie, aby zobaczyć swoje wypożyczenia.",
  "403": "Brak uprawnień do wyświetlenia wypożyczeń.",
  "404": "Nie znaleziono aktywnych wypożyczeń.",
  "500": "Wystąpił problem po stronie serwera. Spróbuj ponownie później.",
  default: "Wystąpił nieoczekiwany błąd. Skontaktuj się z pomocą techniczną.",
};

const getErrorMessage = (error: any, context: string = "default"): string => {
  if (error instanceof Error) {
    try {
      const errorData = JSON.parse(error.message);
      return ERROR_MESSAGES[errorData.status] || ERROR_MESSAGES[context] || ERROR_MESSAGES.default;
    } catch {
      return ERROR_MESSAGES[error.message] || ERROR_MESSAGES[context] || ERROR_MESSAGES.default;
    }
  }
  return ERROR_MESSAGES[context] || ERROR_MESSAGES.default;
};

const RentalsPage = () => {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [serverMessage, setServerMessage] = useState("");
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

  const getPrimaryButtonStyles = () => ({
    backgroundColor: buttonBackgroundColor,
    border: theme === "dark" ? `2px solid ${buttonBorderColor}` : undefined,
  });

  const getAlertMessageStyle = () => ({
    backgroundColor: serverMessage.includes("Sukces") ? "alert-success" : serverMessage.includes("Informacja") ? "alert-info" : errorColor,
    color: textColor,
    fontSize: "0.9rem",
  });

  const getListItemBackgroundStyle = () => ({
    backgroundColor: theme === "dark" ? "#343a40" : "#f8f9fa",
    color: textColor,
    border: "none",
  });

  const getListItemHoverBackgroundStyle = () => ({
    backgroundColor: theme === "dark" ? "#3e444a" : "#e9ecef",
  });

  const fetchRentals = async () => {
    setLoading(true);
    setServerMessage("");

    const token = Cookies.get("token");
    if (!token) {
      setServerMessage(ERROR_MESSAGES["401"]);
      setTimeout(() => navigate("/login"), 2000);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/CarRental/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Otrzymano nieprawidłowe dane z serwera.");
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error("Otrzymano nieprawidłowe dane. Spodziewano się listy wypożyczeń.");
      }

      const mappedRentals: Rental[] = data.map((item: any) => ({
        id: item.carRentalId,
        carListing: {
          brand: item.carListing.brand,
          carType: item.carListing.carType,
          rentalPricePerDay: item.carListing.rentalPricePerDay,
        },
        rentalStartDate: item.rentalStartDate,
        rentalEndDate: item.rentalEndDate,
        rentalStatus: item.rentalStatus,
      }));

      setRentals(mappedRentals);
      setServerMessage(mappedRentals.length === 0 ? "Informacja: Nie masz aktywnych wypożyczeń." : "");
    } catch (error) {
      setServerMessage(getErrorMessage(error, "fetch"));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRental = async (rentalId: number) => {
    const token = Cookies.get("token");
    if (!token) {
      setServerMessage(ERROR_MESSAGES["401"]);
      setTimeout(() => navigate("/login"), 2000);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/CarListings/${rentalId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP ${response.status}`);
      }

      setRentals(rentals.filter((rental) => rental.id !== rentalId));
      setServerMessage("Sukces: Wypożyczenie zostało anulowane.");
    } catch (error) {
      setServerMessage(getErrorMessage(error, "cancel"));
    }
  };

  useEffect(() => {
    fetchRentals();
    const interval = setInterval(fetchRentals, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [navigate]);

  const handleRetry = () => fetchRentals();

  const handleViewDetails = (rentalId: number) => {
    navigate(`/rentals/${rentalId}`);
  };

  const dateFormatOptions: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  };

  return (
    <div className={`d-flex flex-column align-items-center min-vh-100 theme-${theme} py-5`} style={{ backgroundColor }}>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="card shadow-lg p-4 rounded w-100"
        style={{ maxWidth: "800px", backgroundColor: cardBackgroundColor, color: textColor }}
      >
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="text-center mb-0" style={{ color: textColor }}>Moje wypożyczenia</h2>
          <motion.button
            onClick={fetchRentals}
            className={`btn ${buttonColor} rounded-pill text-white`}
            style={getPrimaryButtonStyles()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={loading}
          >
            <FaRedo className="me-2" />
            Odśwież
          </motion.button>
        </div>

        {serverMessage && (
          <div
            className={`alert rounded-pill text-center mb-3 d-flex justify-content-between align-items-center p-2`}
            style={getAlertMessageStyle()}
          >
            <span>{serverMessage}</span>
            {serverMessage.includes("Spróbuj ponownie") && (
              <motion.button
                onClick={handleRetry}
                className={`btn btn-sm ${buttonColor} text-white`}
                style={getPrimaryButtonStyles()}
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
        ) : rentals.length === 0 && !serverMessage ? (
          <p className="text-center" style={{ color: textColor }}>Brak aktywnych wypożyczeń.</p>
        ) : (
          <div className="list-group">
            {rentals.map((rental) => (
              <motion.div
                key={rental.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                className="list-group-item mb-3 rounded d-flex justify-content-between align-items-center"
                style={getListItemBackgroundStyle()}
                whileHover={{ scale: 1.02, ...getListItemHoverBackgroundStyle() }}
              >
                <div className="d-flex align-items-center">
                  <FaCar className="me-3" style={{ color: textColor, fontSize: "1.5em" }} />
                  <div>
                    <h5 className="mb-1" style={{ color: textColor }}>
                      {rental.carListing.brand} ({rental.carListing.carType})
                    </h5>
                    <p className="mb-1" style={{ color: textColor }}>
                      Od: {new Date(rental.rentalStartDate).toLocaleDateString("pl-PL", dateFormatOptions)} Do:{" "}
                      {new Date(rental.rentalEndDate).toLocaleDateString("pl-PL", dateFormatOptions)}
                    </p>
                    <p className="mb-0" style={{ color: textColor }}>Status: {rental.rentalStatus}</p>
                    <p className="mb-0" style={{ color: textColor }}>
                      Cena za dzień: {rental.carListing.rentalPricePerDay} zł
                    </p>
                  </div>
                </div>
                <div>
                  <motion.button
                    onClick={() => handleViewDetails(rental.id)}
                    className={`btn btn-sm ${buttonColor} me-2 text-white`}
                    style={getPrimaryButtonStyles()}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaInfoCircle className="me-1" />
                    Szczegóły
                  </motion.button>
                  {rental.rentalStatus !== "Ended" && (
                    <motion.button
                      onClick={() => handleCancelRental(rental.id)}
                      className="btn btn-sm btn-danger text-white"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FaTimes className="me-1" />
                      Anuluj
                    </motion.button>
                  )}
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