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

interface CarListing {
  id: number;
  brand: string;
  engineCapacity: number;
  fuelType: string;
  seats: number;
  carType: string;
  rentalPricePerDay: number;
  isAvailable: boolean;
  userId: number;
  features: string[];
  latitude: number;
  longitude: number;
}

interface CarRentalRequest {
  carListingId: number;
  rentalStartDate: string;
  rentalEndDate: string;
}

interface DecodedToken {
  nameid: string;
}

const containerStyle = { width: "100%", height: "400px" };

// Debounce utility function
const debounce = (func: (...args: any[]) => void, delay: number) => {
  let timeoutId: number; // Changed from NodeJS.Timeout to number
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const RentCarPage = () => {
  const [listings, setListings] = useState<CarListing[]>([]);
  const [filteredListings, setFilteredListings] = useState<CarListing[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRentalModal, setShowRentalModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<CarListing | null>(null);
  const [selectedMapListing, setSelectedMapListing] = useState<CarListing | null>(null);
  const [rentalData, setRentalData] = useState<CarRentalRequest>({
    carListingId: 0,
    rentalStartDate: "",
    rentalEndDate: "",
  });
  const [city, setCity] = useState("");
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [addresses, setAddresses] = useState<{ [key: number]: string }>({});
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [filterBrand, setFilterBrand] = useState<string>("");
  const [filterFuelType, setFilterFuelType] = useState<string>("all");
  const [filterPriceMin, setFilterPriceMin] = useState<string>("");
  const [filterPriceMax, setFilterPriceMax] = useState<string>("");
  const [filterSeatsMin, setFilterSeatsMin] = useState<string>("");

  const {
    theme,
    backgroundColor,
    cardBackgroundColor,
    textColor,
    buttonColor,
    errorColor,
    buttonBackgroundColor,
    buttonBorderColor,
  } = useThemeStyles();
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const navigate = useNavigate();

  useEffect(() => {
    const token = Cookies.get("token");
    if (token) {
      try {
        const decoded: DecodedToken = jwtDecode(token);
        const userId = parseInt(decoded.nameid);
        setCurrentUserId(userId);
      } catch (error) {
        setMessage("Błąd dekodowania tokena. Przekierowuję na stronę logowania...");
        setTimeout(() => navigate("/login"), 2000);
      }
    } else {
      setMessage("Nie jesteś zalogowany. Przekierowuję na stronę logowania...");
      setTimeout(() => navigate("/login"), 2000);
    }
  }, [navigate]);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleMapsApiKey}`
      );
      if (!response.ok) throw new Error(`Błąd HTTP ${response.status}`);
      const data = await response.json();
      return data.status === "OK" && data.results.length > 0
        ? data.results[0].formatted_address
        : "Adres nieznany";
    } catch {
      return "Błąd pobierania adresu";
    }
  };

  const geocodeCity = async (city: string) => {
    if (!city.trim()) return setMessage("Proszę wpisać nazwę miasta."), false;
    if (!googleMapsApiKey) return setMessage("Brak klucza API Google Maps."), false;
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          city
        )}&key=${googleMapsApiKey}`
      );
      if (!response.ok) throw new Error(`Błąd HTTP ${response.status}`);
      const data = await response.json();
      if (data.status !== "OK" || !data.results.length)
        throw new Error("Nie znaleziono miasta.");
      setCoordinates(data.results[0].geometry.location);
      setMessage("");
      return true;
    } catch {
      setMessage("Błąd: Nieznany błąd.");
      return false;
    }
  };

  const fetchAvailableListings = useCallback(async () => {
    setLoading(true);
    const token = Cookies.get("token");
    if (!token) {
      setMessage("Nie jesteś zalogowany. Przekierowuję na stronę logowania...");
      setTimeout(() => navigate("/login"), 2000);
      setLoading(false);
      return;
    }
    if (!coordinates) {
      setMessage("Proszę wpisać miasto.");
      setLoading(false);
      return;
    }
    if (currentUserId === null) {
      setMessage("Błąd: Nie udało się pobrać ID użytkownika.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `https://localhost:5001/api/CarListings/list?lat=${coordinates.lat}&lng=${coordinates.lng}&radius=50`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(
          JSON.parse(errorData)?.message || errorData || "Błąd pobierania ogłoszeń."
        );
      }
      const data = await response.json();
      const filteredListings = data.filter(
        (listing: CarListing) => listing.isAvailable && listing.userId !== currentUserId
      );
      setListings(filteredListings);
      setFilteredListings(filteredListings);

      // Batch reverse geocoding with a delay to avoid rate limits
      const addressResults = [];
      for (const listing of filteredListings) {
        const address = await reverseGeocode(listing.latitude, listing.longitude);
        addressResults.push({ id: listing.id, address });
        await new Promise((resolve) => setTimeout(resolve, 100)); // Delay to avoid rate limits
      }
      setAddresses(
        addressResults.reduce((acc, { id, address }) => ({ ...acc, [id]: address }), {})
      );
      setMessage(
        filteredListings.length === 0 ? "Brak dostępnych samochodów w regionie." : ""
      );
    } catch (error) {
      setMessage(`Błąd: ${error instanceof Error ? error.message : "Nieznany błąd."}`);
    } finally {
      setLoading(false);
    }
  }, [coordinates, currentUserId, navigate]);

  const handleRent = async () => {
    if (!selectedListing || !rentalData.rentalStartDate || !rentalData.rentalEndDate) {
      setMessage("Wypełnij wszystkie pola.");
      return;
    }
    if (new Date(rentalData.rentalEndDate) <= new Date(rentalData.rentalStartDate)) {
      setMessage("Data zakończenia musi być późniejsza.");
      return;
    }
    if (currentUserId === null) {
      setMessage("Błąd: Nie udało się pobrać ID użytkownika.");
      return;
    }
    if (selectedListing.userId === currentUserId) {
      setMessage("Nie możesz wypożyczyć własnego samochodu.");
      return;
    }

    const token = Cookies.get("token");
    if (!token) {
      setMessage("Nie jesteś zalogowany. Przekierowuję na stronę logowania...");
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
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(
          JSON.parse(errorData)?.message || errorData || "Błąd wypożyczania."
        );
      }
      setMessage("Wypożyczenie utworzone pomyślnie!");
      setShowRentalModal(false);
      fetchAvailableListings();
    } catch (error) {
      setMessage(`Błąd: ${error instanceof Error ? error.message : "Nieznany błąd."}`);
    }
  };

  const handleSearch = async () => {
    const success = await geocodeCity(city);
    if (success) fetchAvailableListings();
  };

  // Debounce the search to prevent rapid successive calls
  const debouncedSearch = useCallback(debounce(handleSearch, 500), [city, coordinates]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      debouncedSearch();
    }
  };

  useEffect(() => {
    let filtered = listings;

    if (filterBrand) {
      filtered = filtered.filter((listing) =>
        listing.brand.toLowerCase().includes(filterBrand.toLowerCase())
      );
    }

    if (filterFuelType !== "all") {
      filtered = filtered.filter((listing) => listing.fuelType === filterFuelType);
    }

    const priceMin = filterPriceMin ? parseFloat(filterPriceMin) : 0;
    const priceMax = filterPriceMax ? parseFloat(filterPriceMax) : Infinity;
    if (filterPriceMin || filterPriceMax) {
      filtered = filtered.filter(
        (listing) =>
          listing.rentalPricePerDay >= priceMin &&
          listing.rentalPricePerDay <= priceMax
      );
    }

    const seatsMin = filterSeatsMin ? parseInt(filterSeatsMin) : 0;
    if (filterSeatsMin) {
      filtered = filtered.filter((listing) => listing.seats >= seatsMin);
    }

    setFilteredListings(filtered);
    setMessage(filtered.length === 0 ? "Brak samochodów pasujących do filtrów." : "");
  }, [filterBrand, filterFuelType, filterPriceMin, filterPriceMax, filterSeatsMin, listings]);

  useEffect(() => {
    if (coordinates && currentUserId !== null) {
      fetchAvailableListings();
    }
  }, [coordinates, currentUserId]);

  if (!googleMapsApiKey) {
    return (
      <p className="text-danger text-center mt-3">
        Brak klucza API Google Maps. Sprawdź plik .env.
      </p>
    );
  }

  return (
    <div className={`vh-100 theme-${theme}`} style={{ backgroundColor }}>
      <div className="container py-4">
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mb-4"
          style={{ color: textColor }}
        >
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
                style={{
                  backgroundColor: buttonBackgroundColor,
                  border: theme === "dark" ? `2px solid ${buttonBorderColor}` : undefined,
                }}
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
              <label className="form-label" style={{ color: textColor }}>
                Marka
              </label>
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
              <label className="form-label" style={{ color: textColor }}>
                Typ paliwa
              </label>
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
              <label className="form-label" style={{ color: textColor }}>
                Cena min (zł)
              </label>
              <input
                type="number"
                className="form-control"
                value={filterPriceMin}
                onChange={(e) => setFilterPriceMin(e.target.value)}
                placeholder="Min"
                style={{ backgroundColor: cardBackgroundColor, color: textColor }}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label" style={{ color: textColor }}>
                Cena max (zł)
              </label>
              <input
                type="number"
                className="form-control"
                value={filterPriceMax}
                onChange={(e) => setFilterPriceMax(e.target.value)}
                placeholder="Max"
                style={{ backgroundColor: cardBackgroundColor, color: textColor }}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label" style={{ color: textColor }}>
                Min. liczba miejsc
              </label>
              <input
                type="number"
                className="form-control"
                value={filterSeatsMin}
                onChange={(e) => setFilterSeatsMin(e.target.value)}
                placeholder="Min"
                style={{ backgroundColor: cardBackgroundColor, color: textColor }}
              />
            </div>
          </div>
        </div>

        {message && (
          <div
            className={`alert ${message.includes("Błąd") ? errorColor : "alert-success"} text-center`}
          >
            {message}
          </div>
        )}
        {loading ? (
          <p className="text-center" style={{ color: textColor }}>
            Ładowanie...
          </p>
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
                  style={{
                    backgroundColor: cardBackgroundColor,
                    color: textColor,
                    cursor: "pointer",
                  }}
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
                      Lokalizacja: {addresses[listing.id] || "Ładowanie..."}
                    </p>
                    <Button
                      variant={buttonColor}
                      style={{
                        backgroundColor: buttonBackgroundColor,
                        border: theme === "dark" ? `2px solid ${buttonBorderColor}` : undefined,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedListing(listing);
                        setRentalData({ ...rentalData, carListingId: listing.id });
                        setShowRentalModal(true);
                      }}
                    >
                      Wynajmij
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        {selectedMapListing && (
          <Modal
            show={showMapModal}
            onHide={() => setShowMapModal(false)}
            size="lg"
            dialogClassName={`theme-${theme}`}
          >
            <Modal.Header
              closeButton
              style={{ backgroundColor: cardBackgroundColor, color: textColor }}
            >
              <Modal.Title>Lokalizacja: {selectedMapListing.brand}</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ backgroundColor: cardBackgroundColor }}>
              <LoadScript googleMapsApiKey={googleMapsApiKey}>
                <GoogleMap
                  mapContainerStyle={containerStyle}
                  center={{
                    lat: selectedMapListing.latitude,
                    lng: selectedMapListing.longitude,
                  }}
                  zoom={15}
                >
                  <Marker
                    position={{
                      lat: selectedMapListing.latitude,
                      lng: selectedMapListing.longitude,
                    }}
                  />
                </GoogleMap>
              </LoadScript>
              <p className="mt-3" style={{ color: textColor }}>
                Adres: {addresses[selectedMapListing.id] || "Ładowanie..."}
              </p>
            </Modal.Body>
            <Modal.Footer style={{ backgroundColor: cardBackgroundColor }}>
              <Button
                variant="secondary"
                onClick={() => setShowMapModal(false)}
                style={{ backgroundColor: buttonBackgroundColor, color: textColor }}
              >
                Zamknij
              </Button>
            </Modal.Footer>
          </Modal>
        )}
        {selectedListing && (
          <Modal
            show={showRentalModal}
            onHide={() => setShowRentalModal(false)}
            dialogClassName={`theme-${theme}`}
          >
            <Modal.Header
              closeButton
              style={{ backgroundColor: cardBackgroundColor, color: textColor }}
            >
              <Modal.Title>Wynajmij {selectedListing.brand}</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ backgroundColor: cardBackgroundColor }}>
              <div className="mb-3">
                <label className="form-label" style={{ color: textColor }}>
                  Data rozpoczęcia
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={rentalData.rentalStartDate}
                  onChange={(e) =>
                    setRentalData({ ...rentalData, rentalStartDate: e.target.value })
                  }
                />
              </div>
              <div className="mb-3">
                <label className="form-label" style={{ color: textColor }}>
                  Data zakończenia
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={rentalData.rentalEndDate}
                  onChange={(e) =>
                    setRentalData({ ...rentalData, rentalEndDate: e.target.value })
                  }
                />
              </div>
            </Modal.Body>
            <Modal.Footer style={{ backgroundColor: cardBackgroundColor }}>
              <Button
                variant="secondary"
                onClick={() => setShowRentalModal(false)}
              >
                Anuluj
              </Button>
              <Button variant="primary" onClick={handleRent}>
                Wynajmij
              </Button>
            </Modal.Footer>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default RentCarPage;