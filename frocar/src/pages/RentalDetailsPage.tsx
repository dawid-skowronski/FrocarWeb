import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import "bootstrap/dist/css/bootstrap.min.css";
import Cookies from "js-cookie";
import { useThemeStyles } from "../styles/useThemeStyles";
import { useParams, useNavigate } from "react-router-dom";
import { FaCar, FaArrowLeft, FaTimes, FaStar } from "react-icons/fa";

interface CarListing {
  brand: string;
  carType: string;
  rentalPricePerDay: number;
  engineCapacity: number;
  fuelType: string;
  seats: number;
  features: string[];
}

interface Rental {
  id: number;
  carListing: CarListing;
  rentalStartDate: string;
  rentalEndDate: string;
  userId: number;
  rentalStatus: string;
  hasReview?: boolean;
}

const ERROR_MESSAGES: Record<string, string> = {
  "400": "Niepoprawne żądanie. Sprawdź dane i spróbuj ponownie.",
  "401": "Brak autoryzacji. Zaloguj się ponownie.",
  "403": "Brak uprawnień do wykonania tej operacji.",
  "404": "Nie znaleziono zasobu.",
  "500": "Wystąpił problem po stronie serwera. Spróbuj ponownie później.",
  default: "Wystąpił nieoczekiwany błąd. Skontaktuj się z pomocą techniczną.",
};

const getErrorMessage = (error: any, context: string = "default"): string => {
  if (error instanceof Error) {
    try {
      const errorData = JSON.parse(error.message);
      return ERROR_MESSAGES[errorData.status] || errorData.message || ERROR_MESSAGES[context] || ERROR_MESSAGES.default;
    } catch {
      return error.message || ERROR_MESSAGES[context] || ERROR_MESSAGES.default;
    }
  }
  return ERROR_MESSAGES[context] || ERROR_MESSAGES.default;
};

const RentalDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [rental, setRental] = useState<Rental | null>(null);
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(true); 
  const [reviewRating, setReviewRating] = useState<number>(0);
  const [reviewComment, setReviewComment] = useState<string>("");
  const [reviewError, setReviewError] = useState<string>("");
  const [reviewSuccess, setReviewSuccess] = useState<string>("");
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

  const fetchRentalDetails = async () => {
    if (!id) {
      setServerError("Brak ID wypożyczenia w URL.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setServerError("");
    setReviewSuccess("");

    const token = Cookies.get("token");
    if (!token) {
      setServerError("Brak tokena. Zaloguj się ponownie.");
      setLoading(false);
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(`https://localhost:5001/api/CarRental/${id}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify({ status: response.status, message: errorData.message }));
      }

      const data = await response.json();
      const mappedRental: Rental = {
        id: data.carRentalId,
        carListing: {
          brand: data.carListing.brand,
          carType: data.carListing.carType,
          rentalPricePerDay: data.carListing.rentalPricePerDay,
          engineCapacity: data.carListing.engineCapacity,
          fuelType: data.carListing.fuelType,
          seats: data.carListing.seats,
          features: data.carListing.features || [],
        },
        rentalStartDate: data.rentalStartDate,
        rentalEndDate: data.rentalEndDate,
        userId: data.userId,
        rentalStatus: data.rentalStatus,
      };

      if (mappedRental.rentalStatus === "Zakończone") {
        const reviewResponse = await fetch(
          `https://projekt-tripify.hostingasp.pl/api/CarRental/reviews/${data.carListing.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (reviewResponse.ok) {
          const reviews = await reviewResponse.json();
          const hasReview = reviews.some(
            (review: any) => review.carRental.carRentalId === data.carRentalId
          );
          mappedRental.hasReview = hasReview;
          if (hasReview) {
            setReviewSuccess("Recenzja dla tego wypożyczenia została już wystawiona.");
          }
        }
      }

      setRental(mappedRental);
    } catch (error) {
      setServerError(getErrorMessage(error, "fetchRental"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRentalDetails();
  }, [id, navigate]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleCancelRental = async () => {
    if (!id) return;

    const token = Cookies.get("token");
    if (!token) {
      setServerError("Brak tokena. Zaloguj się ponownie.");
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(`https://projekt-tripify.hostingasp.pl/api/CarRental/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify({ status: response.status, message: errorData.message }));
      }

      setServerError("Wypożyczenie zostało anulowane.");
      setTimeout(() => navigate(-1), 2000);
    } catch (error) {
      setServerError(getErrorMessage(error, "cancelRental"));
    }
  };

  const handleSubmitReview = async () => {
    if (!id) {
      setReviewError("Brak ID wypożyczenia.");
      return;
    }

    if (reviewRating < 1 || reviewRating > 5 || !Number.isInteger(reviewRating)) {
      setReviewError("Ocena musi być liczbą całkowitą w zakresie 1-5.");
      return;
    }

    const token = Cookies.get("token");
    if (!token) {
      setReviewError("Brak tokena. Zaloguj się ponownie.");
      navigate("/login");
      return;
    }

    const reviewData = {
      CarRentalId: parseInt(id),
      Rating: reviewRating,
      Comment: reviewComment || "",
    };

    try {
      const response = await fetch("https://projekt-tripify.hostingasp.pl/api/CarRental/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(reviewData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify({ status: response.status, message: errorData.message }));
      }

      const responseData = await response.json();
      setReviewSuccess(responseData.message || "Recenzja została dodana pomyślnie!");
      setReviewRating(0);
      setReviewComment("");
      setReviewError("");
      fetchRentalDetails(); 
      setTimeout(() => navigate("/profile"), 2000);
    } catch (error) {
      setReviewError(getErrorMessage(error, "submitReview"));
      console.error("Review submission error:", error);
    }
  };

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getPrimaryButtonStyles = () => ({
    backgroundColor: buttonBackgroundColor,
    border: theme === "dark" ? `2px solid ${buttonBorderColor}` : undefined,
  });

  const getSecondaryCardBackground = () => ({
    backgroundColor: theme === "dark" ? "#343a40" : "#f8f9fa",
  });

  const getTextAreaStyle = () => ({
    backgroundColor: theme === "dark" ? "#343a40" : "#fff",
    color: textColor,
  });

  const getStarColor = (star: number) => (star <= reviewRating ? "#ffc107" : "#6c757d");

  if (loading) {
    return (
      <div
        className={`d-flex justify-content-center align-items-center min-vh-100 theme-${theme}`}
        style={{ backgroundColor }}
      >
        <div className="text-center">
          <div className="spinner-border" role="status" style={{ color: textColor }}>
            <span className="visually-hidden">Ładowanie...</span>
          </div>
          <p className="mt-2" style={{ color: textColor }}>Ładowanie...</p>
        </div>
      </div>
    );
  }

  if (serverError && !rental) { 
    return (
      <div
        className={`d-flex justify-content-center align-items-center min-vh-100 theme-${theme}`}
        style={{ backgroundColor }}
      >
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="card shadow-lg p-4 rounded"
          style={{
            maxWidth: "600px",
            backgroundColor: cardBackgroundColor,
            color: textColor,
          }}
        >
          <div className={`alert ${errorColor} text-center mb-3`}>{serverError}</div>
          <motion.button
            onClick={handleBack}
            className={`btn ${buttonColor} w-100 rounded-pill text-white`}
            style={getPrimaryButtonStyles()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaArrowLeft className="me-2" />
            Wróć
          </motion.button>
        </motion.div>
      </div>
    );
  }

  if (!rental) {
    return null; 
  }

  const duration = calculateDuration(rental.rentalStartDate, rental.rentalEndDate);
  const totalCost = duration * rental.carListing.rentalPricePerDay;

  const dateFormatOptions: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
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
          maxWidth: "600px",
          backgroundColor: cardBackgroundColor,
          color: textColor,
        }}
      >
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0" style={{ color: textColor }}>
            Szczegóły wypożyczenia
          </h2>
          <motion.button
            onClick={handleBack}
            className={`btn ${buttonColor} rounded-pill text-white`}
            style={getPrimaryButtonStyles()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaArrowLeft className="me-2" />
            Wróć
          </motion.button>
        </div>

        {serverError && ( 
          <div className={`alert ${errorColor} text-center mb-3 rounded-pill`}>
            {serverError}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="mb-4 p-3 rounded"
            >
          <h4 className="d-flex align-items-center mb-3" style={{ color: textColor }}>
            <FaCar className="me-2" style={{ fontSize: "1.5em" }} />
            {rental.carListing.brand} ({rental.carListing.carType})
          </h4>
          <div className="row">
            <div className="col-md-6 mb-2">
              <p className="mb-1" style={{ color: textColor }}>
                <strong>Okres wypożyczenia:</strong>
              </p>
              <p style={{ color: textColor }}>
                Od: {new Date(rental.rentalStartDate).toLocaleDateString("pl-PL", dateFormatOptions)}{" "}
                Do: {new Date(rental.rentalEndDate).toLocaleDateString("pl-PL", dateFormatOptions)}
              </p>
              <p style={{ color: textColor }}>
                <strong>Czas trwania:</strong> {duration} dni
              </p>
              <p style={{ color: textColor }}>
                <strong>Status:</strong> {rental.rentalStatus}
              </p>
            </div>
            <div className="col-md-6 mb-2">
              <p className="mb-1" style={{ color: textColor }}>
                <strong>Koszty:</strong>
              </p>
              <p style={{ color: textColor }}>
                Cena za dzień: {rental.carListing.rentalPricePerDay} zł
              </p>
              <p style={{ color: textColor }}>
                Całkowity koszt: {totalCost} zł
              </p>
            </div>
          </div>
          <hr style={{ borderColor: textColor }} />
          <h5 className="mb-2" style={{ color: textColor }}>
            Szczegóły pojazdu
          </h5>
          <div className="row">
            <div className="col-md-6 mb-2">
              <p style={{ color: textColor }}>
                <strong>Pojemność silnika:</strong> {rental.carListing.engineCapacity}L
              </p>
              <p style={{ color: textColor }}>
                <strong>Typ paliwa:</strong> {rental.carListing.fuelType}
              </p>
            </div>
            <div className="col-md-6 mb-2">
              <p style={{ color: textColor }}>
                <strong>Liczba miejsc:</strong> {rental.carListing.seats}
              </p>
              <p style={{ color: textColor }}>
                <strong>Dodatki:</strong>{" "}
                {rental.carListing.features?.length > 0
                  ? rental.carListing.features.join(", ")
                  : "Brak"}
              </p>
            </div>
          </div>
        </motion.div>

        {rental.rentalStatus === "Zakończone" && !rental.hasReview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="mb-4 p-3 rounded"
            style={getSecondaryCardBackground()}
          >
            <h5 className="mb-3" style={{ color: textColor }}>
              Wystaw recenzję
            </h5>
            {reviewError && (
              <div className={`alert ${errorColor} text-center mb-3 rounded-pill`}>{reviewError}</div>
            )}
            <div className="mb-3">
              <label className="form-label" style={{ color: textColor }}>
                Ocena (1-5)
              </label>
              <div>
                {[1, 2, 3, 4, 5].map((star) => (
                  <FaStar
                    key={star}
                    className="me-1"
                    style={{
                      color: getStarColor(star),
                      cursor: "pointer",
                      fontSize: "1.5em",
                    }}
                    onClick={() => setReviewRating(star)}
                  />
                ))}
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label" style={{ color: textColor }}>
                Komentarz
              </label>
              <textarea
                className="form-control rounded" 
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={4}
                style={getTextAreaStyle()}
              />
            </div>
            <motion.button
              onClick={handleSubmitReview}
              className={`btn ${buttonColor} w-100 rounded-pill text-white`}
              style={getPrimaryButtonStyles()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Wyślij recenzję
            </motion.button>
          </motion.div>
        )}

        {reviewSuccess && (
          <div className="alert alert-success text-center mb-3 rounded-pill">{reviewSuccess}</div>
        )}

        {rental.rentalStatus !== "Zakończone" && rental.rentalStatus !== "Anulowane" && (
          <motion.button
            onClick={handleCancelRental}
            className="btn btn-danger w-100 rounded-pill text-white"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaTimes className="me-2" />
            Anuluj wypożyczenie
          </motion.button>
        )}
      </motion.div>
    </div>
  );
};

export default RentalDetailsPage;
