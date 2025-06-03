import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import "bootstrap/dist/css/bootstrap.min.css";
import { useThemeStyles } from "../styles/useThemeStyles";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { applyFilters, FilterRule } from "../utils/carFilterContext";
import {
  filterByBrand,
  filterByFuelType,
  filterByMinSeats,
  filterByPriceRange,
} from "../utils/filterStrategies";
import { CarListing } from "../pages/Profile";

interface CarRentalRequest {
  carListingId: number;
  rentalStartDate: string;
  rentalEndDate: string;
}

interface Review {
  reviewId: number;
  carRentalId: number;
  userId: number;
  rating: number;
  comment: string;
  user?: { id: number; userName: string };
  carRental?: { carListingId: number };
}

interface DecodedToken {
  nameid: string;
}

interface Coordinates {
  lat: number;
  lng: number;
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const CONTAINER_STYLE = { width: "100%", height: "400px" };
const SEARCH_RADIUS = 50;
const DEBOUNCE_DELAY = 500;
const ERROR_MESSAGES: Record<string, string> = {
  "401": "Nie jesteś zalogowany. Zaloguj się i spróbuj ponownie.",
  "403": "Brak uprawnień do wykonania tej akcji.",
  "404": "Nie znaleziono samochodów w wybranym regionie.",
  "500": "Wystąpił problem po stronie serwera. Spróbuj ponownie później.",
  default: "Wystąpił nieoczekiwany błąd. Skontaktuj się z pomocą techniczną.",
};


const debounce = <T extends (...args: any[]) => void>(func: T, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const getErrorMessage = (error: any): string => {
  if (error instanceof Error) {
    try {
      const errorData = JSON.parse(error.message);
      return ERROR_MESSAGES[errorData.status] || ERROR_MESSAGES.default;
    } catch {
      return ERROR_MESSAGES[error.message] || ERROR_MESSAGES.default;
    }
  }
  return ERROR_MESSAGES.default;
};

const RentCarPage = () => {
  const [listings, setListings] = useState<CarListing[]>([]);
  const [filteredListings, setFilteredListings] = useState<CarListing[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRentalModal, setShowRentalModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<CarListing | null>(null);
  const [selectedMapListing, setSelectedMapListing] = useState<CarListing | null>(null);
  const [selectedReviewsListing, setSelectedReviewsListing] = useState<CarListing | null>(null);
  const [rentalData, setRentalData] = useState<CarRentalRequest>({
    carListingId: 0,
    rentalStartDate: "",
    rentalEndDate: "",
  });
  const [city, setCity] = useState("");
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [addresses, setAddresses] = useState<{ [key: number]: string }>({});
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [filterBrand, setFilterBrand] = useState<string>("");
  const [filterFuelType, setFilterFuelType] = useState<string>("all");
  const [filterPriceMin, setFilterPriceMin] = useState<number | "">("");
  const [filterPriceMax, setFilterPriceMax] = useState<number | "">("");
  const [filterSeatsMin, setFilterSeatsMin] = useState<number | "">("");

  const { theme, backgroundColor, cardBackgroundColor, textColor, buttonColor, errorColor, buttonBackgroundColor, buttonBorderColor } = useThemeStyles();
  const navigate = useNavigate();

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) {
      setMessage(ERROR_MESSAGES["401"]);
      setTimeout(() => navigate("/login"), 2000);
      return;
    }
    try {
      const decoded: DecodedToken = jwtDecode(token);
      setCurrentUserId(parseInt(decoded.nameid));
    } catch {
      setMessage("Błąd dekodowania sesji. Przekierowuję na stronę logowania...");
      setTimeout(() => navigate("/login"), 2000);
    }
  }, [navigate]);

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
      );
      if (!response.ok) throw new Error(`Błąd HTTP ${response.status}`);
      const data = await response.json();
      return data.status === "OK" && data.results.length > 0
        ? data.results[0].formatted_address
        : "Adres nieznany";
    } catch {
      return "Nie udało się pobrać adresu.";
    }
  };

  const geocodeCity = async (city: string): Promise<boolean> => {
    if (!city.trim()) {
      setMessage("Proszę wpisać nazwę miasta.");
      return false;
    }
    if (!GOOGLE_MAPS_API_KEY) {
      setMessage("Brak konfiguracji mapy. Skontaktuj się z administratorem.");
      return false;
    }
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city)}&key=${GOOGLE_MAPS_API_KEY}`
      );
      if (!response.ok) throw new Error(`Błąd HTTP ${response.status}`);
      const data = await response.json();
      if (data.status !== "OK" || !data.results.length) {
        setMessage("Nie znaleziono miasta. Spróbuj wpisać inną nazwę.");
        return false;
      }
      setCoordinates(data.results[0].geometry.location);
      setMessage("");
      return true;
    } catch {
      setMessage("Nie udało się znaleźć miasta. Spróbuj ponownie.");
      return false;
    }
  };

  const fetchAvailableListings = useCallback(async () => {
    if (!coordinates || currentUserId === null) {
      setMessage(coordinates ? "Błąd sesji użytkownika." : "Proszę wpisać miasto.");
      return;
    }

    setLoading(true);
    const token = Cookies.get("token");
    if (!token) {
      setMessage(ERROR_MESSAGES["401"]);
      setTimeout(() => navigate("/login"), 2000);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `https://localhost:5001/api/CarListings/list?lat=${coordinates.lat}&lng=${coordinates.lng}&radius=${SEARCH_RADIUS}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      const filteredListings = data.filter(
        (listing: CarListing) => listing.isAvailable && listing.userId !== currentUserId && listing.isApproved
      );
      setListings(filteredListings);
      setFilteredListings(filteredListings);

      const addressResults = await Promise.all(
        filteredListings.map(async (listing: CarListing) => ({
          id: listing.id,
          address: await reverseGeocode(listing.latitude, listing.longitude),
        }))
      );
      setAddresses(addressResults.reduce((acc, { id, address }) => ({ ...acc, [id]: address }), {}));
      setMessage(filteredListings.length === 0 ? "Brak dostępnych samochodów w wybranym regionie." : "");
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [coordinates, currentUserId, navigate]);

  const fetchReviewsForListing = async (listingId: number) => {
    const token = Cookies.get("token");
    if (!token) {
      setMessage(ERROR_MESSAGES["401"]);
      return;
    }
    try {
      const response = await fetch(
        `https://localhost:5001/api/CarRental/reviews/${listingId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error(await response.text());
      setReviews(await response.json());
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  };

  const handleRent = async () => {
    if (!selectedListing || !rentalData.rentalStartDate || !rentalData.rentalEndDate) {
      setMessage("Proszę wypełnić wszystkie pola w formularzu wynajmu.");
      return;
    }
    if (new Date(rentalData.rentalEndDate) <= new Date(rentalData.rentalStartDate)) {
      setMessage("Data zakończenia musi być późniejsza niż data rozpoczęcia.");
      return;
    }
    if (currentUserId === null) {
      setMessage("Błąd sesji użytkownika. Zaloguj się ponownie.");
      return;
    }
    if (selectedListing.userId === currentUserId) {
      setMessage("Nie możesz wypożyczyć własnego samochodu.");
      return;
    }
    if (!selectedListing.isApproved) {
      setMessage("To ogłoszenie nie jest zatwierdzone.");
      return;
    }

    const token = Cookies.get("token");
    if (!token) {
      setMessage(ERROR_MESSAGES["401"]);
      setTimeout(() => navigate("/login"), 2000);
      return;
    }

    try {
      const response = await fetch("https://localhost:5001/api/CarRental/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          carListingId: selectedListing.id,
          rentalStartDate: rentalData.rentalStartDate,
          rentalEndDate: rentalData.rentalEndDate,
        }),
      });
      if (!response.ok) throw new Error(await response.text());
      setMessage("Samochód został pomyślnie wypożyczony!");
      setShowRentalModal(false);
      fetchAvailableListings();
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  };

  const handleSearch = async () => {
    const success = await geocodeCity(city);
    if (success) fetchAvailableListings();
  };

  const debouncedSearch = useCallback(debounce(handleSearch, DEBOUNCE_DELAY), [city]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") debouncedSearch();
  };

  useEffect(() => {
    if (filterPriceMin !== "" && filterPriceMax !== "" && Number(filterPriceMin) > Number(filterPriceMax)) {
      setMessage("Cena minimalna nie może być większa niż maksymalna.");
      setFilteredListings([]);
      return;
    }

    const filters: FilterRule[] = [];
    if (filterBrand) filters.push({ strategy: filterByBrand, value: filterBrand });
    if (filterFuelType !== "all") filters.push({ strategy: filterByFuelType, value: filterFuelType });
    if (filterSeatsMin !== "" && !isNaN(Number(filterSeatsMin))) {
      filters.push({ strategy: filterByMinSeats, value: Number(filterSeatsMin) });
    }
    if (filterPriceMin !== "" || filterPriceMax !== "") {
      filters.push({
        strategy: filterByPriceRange,
        value: { min: filterPriceMin !== "" ? Number(filterPriceMin) : 0, max: filterPriceMax !== "" ? Number(filterPriceMax) : Infinity },
      });
    }

    const filtered = applyFilters(listings, filters);
    setFilteredListings(filtered);
    setMessage(filtered.length === 0 ? "Brak samochodów pasujących do filtrów." : "");
  }, [filterBrand, filterFuelType, filterPriceMin, filterPriceMax, filterSeatsMin, listings]);

  useEffect(() => {
    if (coordinates && currentUserId !== null) fetchAvailableListings();
  }, [coordinates, currentUserId, fetchAvailableListings]);

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <p className="text-danger text-center mt-3">
        Brak konfiguracji mapy. Skontaktuj się z administratorem.
      </p>
    );
  }

  return (
    <div className={`vh-100 theme-${theme}`} style={{ backgroundColor }}>
      <div className="container py-4">
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-4" style={{ color: textColor }}>
          Wynajmij samochód
        </motion.h1>
        <div className="row mb-4">
          <div className="col-md-6 offset-md-3">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Wpisz miasto (np. Warszawa)"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onKeyDown={handleKeyPress}
                style={{ backgroundColor: cardBackgroundColor, color: textColor }}
              />
              <Button
                variant={buttonColor}
                style={{ backgroundColor: buttonBackgroundColor, border: theme === "dark" ? `2px solid ${buttonBorderColor}` : undefined }}
                onClick={debouncedSearch}
              >
                Szukaj
              </Button>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h4 style={{ color: textColor }}>Filtruj samochody</h4>
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label" style={{ color: textColor }}>Marka</label>
              <input
                type="text"
                className="form-control"
                value={filterBrand}
                onChange={(e) => setFilterBrand(e.target.value)}
                placeholder="Wpisz markę"
                style={{ backgroundColor: cardBackgroundColor, color: textColor }}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label" style={{ color: textColor }}>Typ paliwa</label>
              <select
                className="form-control"
                value={filterFuelType}
                onChange={(e) => setFilterFuelType(e.target.value)}
                style={{ backgroundColor: cardBackgroundColor, color: textColor }}
              >
                <option value="all">Wszystkie</option>
                <option value="benzyna">Benzyna</option>
                <option value="diesel">Diesel</option>
                <option value="elektryczny">Elektryczny</option>
                <option value="hybryda">Hybryda</option>
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label" style={{ color: textColor }}>Cena min (zł)</label>
              <input
                type="number"
                className="form-control"
                value={filterPriceMin}
                onChange={(e) => setFilterPriceMin(parseFloat(e.target.value) || "")}
                placeholder="Min"
                style={{ backgroundColor: cardBackgroundColor, color: textColor }}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label" style={{ color: textColor }}>Cena max (zł)</label>
              <input
                type="number"
                className="form-control"
                value={filterPriceMax}
                onChange={(e) => setFilterPriceMax(parseFloat(e.target.value) || "")}
                placeholder="Max"
                style={{ backgroundColor: cardBackgroundColor, color: textColor }}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label" style={{ color: textColor }}>Min. liczba miejsc</label>
              <input
                type="number"
                className="form-control"
                value={filterSeatsMin}
                onChange={(e) => setFilterSeatsMin(parseInt(e.target.value) || "")}
                placeholder="Min"
                style={{ backgroundColor: cardBackgroundColor, color: textColor }}
              />
            </div>
          </div>
        </div>

        {message && (
          <div className={`alert ${message.includes("Błąd") || message.includes("Nie") ? errorColor : "alert-success"} text-center`}>
            {message}
          </div>
        )}
        {loading ? (
          <p className="text-center" style={{ color: textColor }}>Ładowanie...</p>
        ) : (
          <div className="row">
            {filteredListings.map((listing) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="col-md-4 mb-4"
              >
                <div
                  className="card shadow-sm"
                  style={{ backgroundColor: cardBackgroundColor, color: textColor, cursor: "pointer" }}
                  onClick={() => {
                    setSelectedMapListing(listing);
                    setShowMapModal(true);
                  }}
                >
                  <div className="card-body">
                    <h5 className="card-title">{listing.brand}</h5>
                    <p className="card-text">
                      Typ: {listing.carType} <br />
                      Silnik: {listing.engineCapacity}L, {listing.fuelType} <br />
                      Miejsca: {listing.seats} <br />
                      Cena/dzień: {listing.rentalPricePerDay} zł <br />
                      Dodatki: {listing.features.join(", ") || "Brak"} <br />
                      Lokalizacja: {addresses[listing.id] || "Ładowanie..."} <br />
                      Średnia ocena: {listing.averageRating?.toFixed(1) || "Brak ocen"}
                    </p>
                    <Button
                      variant={buttonColor}
                      style={{ backgroundColor: buttonBackgroundColor, border: theme === "dark" ? `2px solid ${buttonBorderColor}` : undefined }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedListing(listing);
                        setRentalData({ ...rentalData, carListingId: listing.id });
                        setShowRentalModal(true);
                      }}
                    >
                      Wynajmij
                    </Button>
                    <Button
                      variant={buttonColor}
                      style={{ backgroundColor: buttonBackgroundColor, border: theme === "dark" ? `2px solid ${buttonBorderColor}` : undefined, marginLeft: "10px" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedReviewsListing(listing);
                        fetchReviewsForListing(listing.id);
                        setShowReviewsModal(true);
                      }}
                    >
                      Pokaż recenzje
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        {selectedListing && (
          <Modal show={showRentalModal} onHide={() => setShowRentalModal(false)} dialogClassName={`theme-${theme}`}>
            <Modal.Header closeButton style={{ backgroundColor: cardBackgroundColor, color: textColor }}>
              <Modal.Title>Wynajmij {selectedListing.brand}</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ backgroundColor: cardBackgroundColor }}>
              <div className="mb-3">
                <label className="form-label" style={{ color: textColor }}>Data rozpoczęcia</label>
                <input
                  type="date"
                  className="form-control"
                  value={rentalData.rentalStartDate}
                  onChange={(e) => setRentalData({ ...rentalData, rentalStartDate: e.target.value })}
                  style={{ backgroundColor: cardBackgroundColor, color: textColor }}
                />
              </div>
              <div className="mb-3">
                <label className="form-label" style={{ color: textColor }}>Data zakończenia</label>
                <input
                  type="date"
                  className="form-control"
                  value={rentalData.rentalEndDate}
                  onChange={(e) => setRentalData({ ...rentalData, rentalEndDate: e.target.value })}
                  style={{ backgroundColor: cardBackgroundColor, color: textColor }}
                />
              </div>
            </Modal.Body>
            <Modal.Footer style={{ backgroundColor: cardBackgroundColor }}>
              <Button
                variant="secondary"
                onClick={() => setShowRentalModal(false)}
                style={{ backgroundColor: buttonBackgroundColor, color: textColor, border: theme === "dark" ? `2px solid ${buttonBorderColor}` : undefined }}
              >
                Anuluj
              </Button>
              <Button
                variant="primary"
                onClick={handleRent}
                style={{ backgroundColor: buttonBackgroundColor, color: textColor, border: theme === "dark" ? `2px solid ${buttonBorderColor}` : undefined }}
              >
                Wynajmij
              </Button>
            </Modal.Footer>
          </Modal>
        )}
        {selectedMapListing && (
          <Modal show={showMapModal} onHide={() => setShowMapModal(false)} size="lg" dialogClassName={`theme-${theme}`}>
            <Modal.Header closeButton style={{ backgroundColor: cardBackgroundColor, color: textColor }}>
              <Modal.Title>Lokalizacja: {selectedMapListing.brand}</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ backgroundColor: cardBackgroundColor }}>
              <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
                <GoogleMap
                  mapContainerStyle={CONTAINER_STYLE}
                  center={{ lat: selectedMapListing.latitude, lng: selectedMapListing.longitude }}
                  zoom={15}
                >
                  <Marker position={{ lat: selectedMapListing.latitude, lng: selectedMapListing.longitude }} />
                </GoogleMap>
              </LoadScript>
              <p className="mt-3" style={{ color: textColor }}>Adres: {addresses[selectedMapListing.id] || "Ładowanie..."}</p>
            </Modal.Body>
            <Modal.Footer style={{ backgroundColor: cardBackgroundColor }}>
              <Button
                variant="secondary"
                onClick={() => setShowMapModal(false)}
                style={{ backgroundColor: buttonBackgroundColor, color: textColor, border: theme === "dark" ? `2px solid ${buttonBorderColor}` : undefined }}
              >
                Zamknij
              </Button>
            </Modal.Footer>
          </Modal>
        )}
        {selectedReviewsListing && (
          <Modal show={showReviewsModal} onHide={() => setShowReviewsModal(false)} size="lg" dialogClassName={`theme-${theme}`}>
            <Modal.Header closeButton style={{ backgroundColor: cardBackgroundColor, color: textColor }}>
              <Modal.Title>Recenzje dla {selectedReviewsListing.brand}</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ backgroundColor: cardBackgroundColor }}>
              {reviews.length > 

0 ? (
                reviews.map((review) => (
                  <div key={review.reviewId} className="mb-3 p-2 border rounded" style={{ backgroundColor: theme === "dark" ? "#2c2f33" : "#f8f9fa" }}>
                    <p style={{ color: textColor }}>
                      <strong>Użytkownik: {review.user?.userName || "Anonim"}</strong> <br />
                      Ocena: {review.rating} / 5 <br />
                      Komentarz: {review.comment || "Brak komentarza"} <br />
                    </p>
                  </div>
                ))
              ) : (
                <p style={{ color: textColor }}>Brak recenzji dla tego ogłoszenia.</p>
              )}
            </Modal.Body>
            <Modal.Footer style={{ backgroundColor: cardBackgroundColor }}>
              <Button
                variant="secondary"
                onClick={() => setShowReviewsModal(false)}
                style={{ backgroundColor: buttonBackgroundColor, color: textColor, border: theme === "dark" ? `2px solid ${buttonBorderColor}` : undefined }}
              >
                Zamknij
              </Button>
            </Modal.Footer>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default RentCarPage;