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

  const fetchRentals = async () => {
    setLoading(true);
    setServerMessage("");

    const token = Cookies.get("token");
    if (!token) {
      setServerMessage("Błąd: Nie jesteś zalogowany. Proszę się zalogować, aby zobaczyć wypożyczenia.");
      setLoading(false);
      setTimeout(() => navigate("/login"), 2000);
      return;
    }

    try {
      const response = await fetch("https://localhost:5001/api/CarRental/user", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        let errorText = await response.text();
        if (response.status === 401) {
          setServerMessage("Błąd: Sesja wygasła. Proszę się zalogować ponownie.");
          setLoading(false);
          setTimeout(() => navigate("/login"), 2000);
          return;
        } else if (response.status === 404) {
          setServerMessage("Błąd: Wypożyczenia nie zostały znalezione.");
        } else if (response.status >= 500) {
          setServerMessage(`Błąd: Problem po stronie serwera. ${errorText || "Spróbuj ponownie później."}`);
        } else {
          setServerMessage(`Błąd: Nie udało się pobrać wypożyczeń. ${errorText || "Sprawdź połączenie."}`);
        }
        setLoading(false);
        return;
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error(`Otrzymano nieprawidłowe dane: ${text || "Brak danych."}`);
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error("Otrzymano nieprawidłowe dane z serwera. Spodziewano się listy wypożyczeń.");
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
      if (mappedRentals.length === 0) {
        setServerMessage("Informacja: Nie masz aktywnych wypożyczeń.");
      }
    } catch (error) {
      setServerMessage(
        error instanceof Error ? `Błąd: ${error.message}. Skontaktuj się z pomocą techniczną, jeśli problem persistsuje.` : "Błąd: Wystąpił nieoczekiwany problem. Spróbuj ponownie później."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRental = async (rentalId: number | undefined) => {
    if (!rentalId) {
      setServerMessage("Błąd: Brak identyfikatora wypożyczenia.");
      return;
    }

    const token = Cookies.get("token");
    if (!token) {
      setServerMessage("Błąd: Sesja wygasła. Proszę się zalogować ponownie.");
      setTimeout(() => navigate("/login"), 2000);
      return;
    }

    try {
      const response = await fetch(`https://localhost:5001/api/CarRental/${rentalId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        let errorText = await response.text();
        if (response.status === 401) {
          setServerMessage("Błąd: Sesja wygasła. Proszę się zalogować ponownie.");
          setTimeout(() => navigate("/login"), 2000);
          return;
        } else if (response.status === 404) {
          setServerMessage("Błąd: Wypożyczenie nie zostało znalezione.");
        } else if (response.status >= 500) {
          setServerMessage(`Błąd: Problem po stronie serwera. ${errorText || "Spróbuj ponownie później."}`);
        } else {
          setServerMessage(`Błąd: Nie udało się anulować wypożyczenia. ${errorText || "Sprawdź połączenie."}`);
        }
        return;
      }

      setRentals(rentals.filter((rental) => rental.id !== rentalId));
      setServerMessage("Sukces: Wypożyczenie zostało anulowane.");
    } catch (error) {
      setServerMessage(
        error instanceof Error ? `Błąd: ${error.message}. Skontaktuj się z pomocą techniczną, jeśli problem pojawia się ponownie` : "Błąd: Wystąpił nieoczekiwany problem. Spróbuj ponownie później."
      );
    }
  };

  useEffect(() => {
    fetchRentals();
    const interval = setInterval(fetchRentals, 30000);
    return () => clearInterval(interval);
  }, [navigate]);

  const handleRetry = () => {
    fetchRentals();
  };

  const handleViewDetails = (rentalId: number | undefined) => {
    if (!rentalId) {
      setServerMessage("Błąd: Brak identyfikatora wypożyczenia.");
      return;
    }
    navigate(`/rentals/${rentalId}`);
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
              border: theme === "dark" ? `2px solid ${buttonBorderColor}` : undefined,
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={loading}
          >
            <FaRedo className="me-2" />
            Odśwież
          </motion.button>
        </div>

        {serverMessage && (
          <div className={`alert ${serverMessage.includes("Sukces") ? "alert-success" : serverMessage.includes("Informacja") ? "alert-info" : errorColor} text-center mb-3 d-flex justify-content-between align-items-center`}>
            <span>{serverMessage}</span>
            {serverMessage.includes("Spróbuj ponownie") && (
              <motion.button
                onClick={handleRetry}
                className={`btn btn-sm ${buttonColor} text-white`}
                style={{
                  backgroundColor: buttonBackgroundColor,
                  border: theme === "dark" ? `2px solid ${buttonBorderColor}` : undefined,
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
        ) : rentals.length === 0 && !serverMessage ? (
          <p className="text-center" style={{ color: textColor }}>
            Brak aktywnych wypożyczeń.
          </p>
        ) : (
          <div className="list-group">
            {rentals.map((rental) => (
              <motion.div
                key={rental.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                className="list-group-item mb-3 rounded d-flex justify-content-between align-items-center"
                style={{
                  backgroundColor: theme === "dark" ? "#343a40" : "#f8f9fa",
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
                      Status: {rental.rentalStatus}
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
                      border: theme === "dark" ? `2px solid ${buttonBorderColor}` : undefined,
                    }}
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