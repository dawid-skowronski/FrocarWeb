import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import "bootstrap/dist/css/bootstrap.min.css";
import { useThemeStyles } from "../styles/useThemeStyles";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import Cookies from "js-cookie";

interface CarListing {
  id: number;
  brand: string;
  engineCapacity: number;
  fuelType: string;
  seats: number;
  carType: string;
  features: string[];
  latitude: number;
  longitude: number;
  userId: number;
  rentalPricePerDay: number;
  isAvailable?: boolean;
  isApproved: boolean;
}

interface Rental {
  carRentalId: number;
  carListing: CarListing;
  rentalStartDate: string;
  rentalEndDate: string;
  rentalStatus: string;
  userId: number;
  hasReview?: boolean; 
}

const RentalHistoryPage = () => {
  const [rentalsHistory, setRentalsHistory] = useState<Rental[]>([]);
  const [message, setMessage] = useState<string>("");
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  const { theme } = useTheme();
  const {
    backgroundColor,
    textColor,
    profileCardStyle,
    tableStyle,
    tableHeaderStyle,
    tableCellStyle,
    alertStyle,
  } = useThemeStyles();

  const navigate = useNavigate();

  const fetchUserRentalHistory = async () => {
    setLoadingHistory(true);
    setMessage("");
    const token = Cookies.get("token");
    if (!token) {
      setMessage("Błąd: Nie jesteś zalogowany. Proszę się zalogować, aby zobaczyć historię wypożyczeń.");
      setLoadingHistory(false);
      setTimeout(() => navigate("/login"), 2000);
      return;
    }

    try {
      const response = await fetch("https://localhost:5001/api/CarRental/user/history", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        let errorText = await response.text();
        if (response.status === 401) {
          setMessage("Błąd: Sesja wygasła. Proszę się zalogować ponownie.");
          setLoadingHistory(false);
          setTimeout(() => navigate("/login"), 2000);
          return;
        } else if (response.status === 404) {
          setMessage("Błąd: Historia wypożyczeń nie została znaleziona.");
        } else if (response.status >= 500) {
          setMessage(`Błąd: Problem po stronie serwera. ${errorText || "Spróbuj ponownie później."}`);
        } else {
          setMessage(`Błąd: Nie udało się pobrać historii wypożyczeń. ${errorText || "Sprawdź połączenie."}`);
        }
        setLoadingHistory(false);
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

      const mappedRentals: Rental[] = await Promise.all(
        data.map(async (item: any) => {
          let hasReview = false;
          const reviewResponse = await fetch(
            `https://localhost:5001/api/CarRental/reviews/${item.carListing.id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (reviewResponse.ok) {
            const reviews = await reviewResponse.json();
            hasReview = reviews.some(
              (review: any) => review.carRental.carRentalId === item.carRentalId
            );
          }

          return {
            carRentalId: item.carRentalId,
            carListing: {
              id: item.carListing.id,
              brand: item.carListing.brand,
              carType: item.carListing.carType,
              rentalPricePerDay: item.carListing.rentalPricePerDay,
              engineCapacity: item.carListing.engineCapacity,
              fuelType: item.carListing.fuelType,
              seats: item.carListing.seats,
              features: item.carListing.features || [],
              latitude: item.carListing.latitude,
              longitude: item.carListing.longitude,
              userId: item.carListing.userId,
              isAvailable: item.carListing.isAvailable,
              isApproved: item.carListing.isApproved,
            },
            rentalStartDate: item.rentalStartDate,
            rentalEndDate: item.rentalEndDate,
            rentalStatus: item.rentalStatus,
            userId: item.userId,
            hasReview,
          };
        })
      );

      setRentalsHistory(mappedRentals);
      if (mappedRentals.length === 0) {
        setMessage("Informacja: Nie masz jeszcze zakończonych wypożyczeń.");
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage(`Błąd: ${error.message}. Skontaktuj się z pomocą techniczną, jeśli problem persistsuje.`);
      } else {
        setMessage("Błąd: Wystąpił nieoczekiwany problem. Spróbuj ponownie później.");
      }
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchUserRentalHistory();
  }, [navigate]);

  const handleRetry = () => {
    fetchUserRentalHistory();
  };

  const handleViewDetails = (rentalId: number) => {
    navigate(`/rentals/${rentalId}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`d-flex justify-content-center align-items-center theme-${theme}`}
      style={{ backgroundColor, color: textColor, minHeight: "100vh", width: "100%", margin: 0, padding: "20px" }}
    >
      <motion.div style={profileCardStyle}>
        <h1 className="text-center mb-4" style={{ color: textColor }}>Historia wypożyczeń</h1>
        {message && (
          <div className="text-center mb-3 d-flex justify-content-between align-items-center" style={alertStyle}>
            <span>{message}</span>
            {message.includes("Spróbuj ponownie") && (
              <motion.button
                onClick={handleRetry}
                className="btn btn-sm btn-primary text-white"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Spróbuj ponownie
              </motion.button>
            )}
          </div>
        )}

        <div className="mb-4">
          {loadingHistory ? (
            <div className="text-center py-4">
              <div className="spinner-border" style={{ color: textColor }} role="status">
                <span className="visually-hidden">Ładowanie...</span>
              </div>
              <p className="mt-2" style={{ color: textColor }}>Ładowanie historii...</p>
            </div>
          ) : rentalsHistory.length === 0 && !message ? (
            <p className="text-center" style={{ color: textColor }}>
              Brak zakończonych wypożyczeń.
            </p>
          ) : (
            <div className="table-responsive">
              <table style={tableStyle}>
                <thead>
                  <tr style={tableHeaderStyle}>
                    <th style={tableCellStyle}>Marka</th>
                    <th style={tableCellStyle}>Typ</th>
                    <th style={tableCellStyle}>Data rozpoczęcia</th>
                    <th style={tableCellStyle}>Data zakończenia</th>
                    <th style={tableCellStyle}>Status</th>
                    <th style={tableCellStyle}>Recenzja</th>
                  </tr>
                </thead>
                <tbody>
                  {rentalsHistory.map((rental) => (
                    <tr
                      key={rental.carRentalId}
                      onClick={() => handleViewDetails(rental.carRentalId)}
                      style={{ cursor: "pointer" }}
                    >
                      <td style={tableCellStyle}>{rental.carListing.brand}</td>
                      <td style={tableCellStyle}>{rental.carListing.carType}</td>
                      <td style={tableCellStyle}>
                        {new Date(rental.rentalStartDate).toLocaleDateString("pl-PL", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </td>
                      <td style={tableCellStyle}>
                        {new Date(rental.rentalEndDate).toLocaleDateString("pl-PL", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </td>
                      <td style={tableCellStyle}>{rental.rentalStatus}</td>
                      <td style={tableCellStyle}>
                        {rental.hasReview ? (
                          <span style={{ color: "green" }}>Wystawiono</span>
                        ) : (
                          <span style={{ color: "orange" }}>Oczekuje</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <motion.button
          style={{
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            padding: "5px 10px",
            borderRadius: "5px",
            cursor: "pointer",
            display: "block",
            margin: "0 auto",
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/profile")}
        >
          Wróć do profilu
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default RentalHistoryPage;