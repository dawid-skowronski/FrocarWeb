import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { useTheme } from "../context/ThemeContext"; 
import { useThemeStyles } from "../styles/useThemeStyles"; 

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

interface ApiError {
  status: number;
  message?: string;
}

const API_URL = "https://localhost:5001";
const ERROR_MESSAGES: Record<string, string> = {
  "401": "Sesja wygasła. Zaloguj się ponownie.",
  "404": "Historia wypożyczeń nie została znaleziona.",
  "500": "Problem po stronie serwera. Spróbuj ponownie później.",
  default: "Wystąpił nieoczekiwany błąd. Skontaktuj się z pomocą techniczną.",
};

const CustomButton = ({ 
  children,
  onClick,
  className = "",
  ariaLabel,
  dataCy,
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  ariaLabel: string;
  dataCy: string;
}) => {
  const { buttonBackgroundColor, buttonBorderColor } = useThemeStyles();
  const { theme } = useTheme();

  return (
    <motion.button
      onClick={onClick}
      className={`btn ${className} text-white rounded-pill`}
      style={{
        backgroundColor: buttonBackgroundColor,
        border: theme === "dark" ? `2px solid ${buttonBorderColor}` : "none",
        padding: "5px 10px",
        cursor: "pointer",
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={ariaLabel}
      data-cy={dataCy}
    >
      {children}
    </motion.button>
  );
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return isNaN(date.getTime())
    ? "Nieprawidłowa data"
    : date.toLocaleDateString("pl-PL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return ERROR_MESSAGES.default;
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof (error as ApiError).status === "number"
  ) {
    return ERROR_MESSAGES[String((error as ApiError).status)] || ERROR_MESSAGES.default;
  }
  return ERROR_MESSAGES.default;
};

const validateRentalItem = (item: unknown): item is Rental => {
  if (!item || typeof item !== "object") return false;
  const rental = item as Rental;
  return (
    typeof rental.carRentalId === "number" &&
    rental.carListing &&
    typeof rental.carListing.id === "number" &&
    typeof rental.carListing.brand === "string" &&
    typeof rental.rentalStartDate === "string" &&
    typeof rental.rentalEndDate === "string" &&
    typeof rental.rentalStatus === "string" &&
    typeof rental.userId === "number"
  );
};

const RentalHistoryPage = () => {
  const [rentalHistory, setRentalHistory] = useState<Rental[]>([]);
  const [message, setMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { theme } = useTheme();
  const { backgroundColor, textColor, profileCardStyle, tableStyle, tableHeaderStyle, tableCellStyle, alertStyle } =
    useThemeStyles();
  const navigate = useNavigate();

  const fetchReviewStatus = useCallback(
    async (rental: Rental, token: string): Promise<boolean> => {
      if (rental.rentalStatus !== "Zakończone") return false;
      try {
        const response = await fetch(`${API_URL}/api/CarRental/reviews/${rental.carListing.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return false;
        const reviews = await response.json();
        return reviews.some((review: { carRental: { carRentalId: number } }) => {
          return review.carRental.carRentalId === rental.carRentalId;
        });
      } catch {
        return false;
      }
    },
    []
  );

  const fetchRentals = useCallback(
    async (token: string): Promise<Rental[]> => {
      const response = await fetch(`${API_URL}/api/CarRental/user/history`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        let errorMessage = `Błąd ${response.status}`;
        try {
            const errorJson = JSON.parse(errorBody);
            errorMessage = errorJson.message || errorMessage;
        } catch { 
            errorMessage = errorBody || errorMessage;
        }
        throw { status: response.status, message: errorMessage } as ApiError;
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Otrzymano nieprawidłowe dane z serwera.");
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error("Otrzymano nieprawidłowe dane z serwera. Spodziewano się listy wypożyczeń.");
      }

      return Promise.all(
        data.map(async (item: unknown) => {
          if (!validateRentalItem(item)) {
            throw new Error("Nieprawidłowa struktura danych wypożyczenia.");
          }

          return {
            carRentalId: (item as Rental).carRentalId, 
            carListing: {
              id: (item as Rental).carListing.id,
              brand: (item as Rental).carListing.brand,
              carType: (item as Rental).carListing.carType,
              rentalPricePerDay: (item as Rental).carListing.rentalPricePerDay,
              engineCapacity: (item as Rental).carListing.engineCapacity,
              fuelType: (item as Rental).carListing.fuelType,
              seats: (item as Rental).carListing.seats,
              features: (item as Rental).carListing.features || [],
              latitude: (item as Rental).carListing.latitude,
              longitude: (item as Rental).carListing.longitude,
              userId: (item as Rental).carListing.userId,
              isAvailable: (item as Rental).carListing.isAvailable,
              isApproved: (item as Rental).carListing.isApproved,
            },
            rentalStartDate: (item as Rental).rentalStartDate,
            rentalEndDate: (item as Rental).rentalEndDate,
            rentalStatus: (item as Rental).rentalStatus,
            userId: (item as Rental).userId,
            hasReview: await fetchReviewStatus(item as Rental, token),
          };
        })
      );
    },
    [fetchReviewStatus]
  );

  const fetchUserRentalHistory = useCallback(async () => {
    setIsLoading(true);
    setMessage("");

    const token = Cookies.get("token");
    if (!token) {
      setMessage("Nie jesteś zalogowany. Przekierowuję do logowania...");
      setIsLoading(false);
      setTimeout(() => navigate("/login"), 2000);
      return;
    }

    try {
      const data = await fetchRentals(token);
      setRentalHistory(data);
      if (data.length === 0) {
        setMessage("Nie masz jeszcze zakończonych lub anulowanych wypożyczeń.");
      }
    } catch (error) {
      setMessage(getErrorMessage(error)); 
      console.error("Błąd pobierania historii:", error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchRentals, navigate]);

  useEffect(() => {
    fetchUserRentalHistory();
  }, [fetchUserRentalHistory]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Zakończone":
        return { color: "green" };
      case "Anulowane":
        return { color: "red" };
      default:
        return { color: textColor };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`d-flex justify-content-center align-items-center theme-${theme} p-3 p-md-4 p-lg-5`}
      style={{ backgroundColor, color: 'black', minHeight: "100vh", width: "100%", padding: "20px" }}
      data-cy="rental-history-page"
    >
      <motion.div style={profileCardStyle} className="w-100 px-3 py-4 p-md-5 rounded-3 shadow-lg" data-cy="rental-history-card">
        <h1 className="text-center mb-4" style={{ color: textColor }} data-cy="rental-history-title">
          Historia wypożyczeń
        </h1>
        {message && (
          <div
            className="text-center mb-3 d-flex justify-content-between align-items-center p-2 rounded"
            style={{ backgroundColor: alertStyle.backgroundColor, color: textColor }}
            role="alert"
            data-cy="alert-message"
          >
            <span>{message}</span>
            {message.includes("Spróbuj ponownie") && (
              <CustomButton 
                onClick={fetchUserRentalHistory}
                className="btn-sm"
                ariaLabel="Spróbuj ponownie"
                dataCy="retry-button"
              >
                Spróbuj ponownie
              </CustomButton>
            )}
          </div>
        )}

        <div className="mb-4">
          {isLoading ? (
            <div className="text-center py-4" data-cy="loading-spinner">
              <div className="spinner-border" style={{ color: textColor }} role="status">
                <span className="visually-hidden">Ładowanie...</span>
              </div>
              <p className="mt-2" style={{ color: textColor }}>Ładowanie historii...</p>
            </div>
          ) : rentalHistory.length === 0 && !message ? (
            <p className="text-center" style={{ color: textColor }} data-cy="no-rentals-message">
              Brak zakończonych lub anulowanych wypożyczeń.
            </p>
          ) : (
            <>
              <div className="table-responsive d-none d-md-block" data-cy="rentals-table-desktop">
                <table style={tableStyle} role="grid" aria-label="Historia wypożyczeń" className="w-100">
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
                    {rentalHistory.map((rental) => (
                      <tr
                        key={rental.carRentalId}
                        onClick={() => navigate(`/rentals/${rental.carRentalId}`)}
                        style={{ cursor: "pointer" }}
                        data-cy={`rental-row-${rental.carRentalId}`}
                      >
                        <td style={tableCellStyle}>{rental.carListing.brand}</td>
                        <td style={tableCellStyle}>{rental.carListing.carType}</td>
                        <td style={tableCellStyle}>{formatDate(rental.rentalStartDate)}</td>
                        <td style={tableCellStyle}>{formatDate(rental.rentalEndDate)}</td>
                        <td style={{ ...tableCellStyle, ...getStatusStyle(rental.rentalStatus) }}>
                          {rental.rentalStatus}
                        </td>
                        <td style={tableCellStyle}>
                          {rental.rentalStatus === "Zakończone" ? (
                            rental.hasReview ? (
                              <span style={{ color: "green" }} data-cy={`review-status-${rental.carRentalId}`}>
                                Wystawiono
                              </span>
                            ) : (
                              <span style={{ color: "orange" }} data-cy={`review-status-${rental.carRentalId}`}>
                                Oczekuje
                              </span>
                            )
                          ) : (
                            <span style={{ color: "gray" }} data-cy={`review-status-${rental.carRentalId}`}>
                              Niedostępna
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="d-md-none mt-4" data-cy="rentals-cards-mobile">
                {rentalHistory.map((rental) => (
                  <div
                    key={rental.carRentalId}
                    className="card mb-3"
                    style={{ backgroundColor: profileCardStyle.backgroundColor, borderColor: profileCardStyle.borderColor, color: textColor }}
                    data-cy={`rental-card-${rental.carRentalId}`}
                  >
                    <div className="card-body">
                      <h5 className="card-title mb-2" style={{ color: textColor }}>{rental.carListing.brand} ({rental.carListing.carType})</h5>
                      <p className="card-text mb-1">
                        <strong style={{ color: textColor }}>Status:</strong>{" "}
                        <span style={getStatusStyle(rental.rentalStatus)}>{rental.rentalStatus}</span>
                      </p>
                      <p className="card-text mb-1"><strong style={{ color: textColor }}>Od:</strong> {formatDate(rental.rentalStartDate)}</p>
                      <p className="card-text mb-1"><strong style={{ color: textColor }}>Do:</strong> {formatDate(rental.rentalEndDate)}</p>
                      <p className="card-text mb-2">
                        <strong style={{ color: textColor }}>Recenzja:</strong>{" "}
                        {rental.rentalStatus === "Zakończone" ? (
                          rental.hasReview ? (
                            <span style={{ color: "green" }} data-cy={`review-status-card-${rental.carRentalId}`}>
                              Wystawiono
                            </span>
                          ) : (
                            <span style={{ color: "orange" }} data-cy={`review-status-card-${rental.carRentalId}`}>
                              Oczekuje
                            </span>
                          )
                        ) : (
                          <span style={{ color: "gray" }} data-cy={`review-status-card-${rental.carRentalId}`}>
                            Niedostępna
                          </span>
                        )}
                      </p>

                      <div className="d-flex flex-column gap-2 mt-3">
                        <CustomButton 
                          onClick={() => navigate(`/rentals/${rental.carRentalId}`)}
                          className="btn-info" 
                          ariaLabel={`Zobacz szczegóły wypożyczenia ${rental.carRentalId}`}
                          dataCy={`view-details-button-card-${rental.carRentalId}`}
                        >
                          Zobacz szczegóły
                        </CustomButton>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <CustomButton 
          onClick={() => navigate("/profile")}
          className="w-100"
          ariaLabel="Wróć do profilu"
          dataCy="back-to-profile-button"
        >
          Wróć do profilu
        </CustomButton>
      </motion.div>
    </motion.div>
  );
};

export default RentalHistoryPage;
