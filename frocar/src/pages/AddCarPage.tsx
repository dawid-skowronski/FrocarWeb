import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import "bootstrap/dist/css/bootstrap.min.css";
import { useThemeStyles } from "../styles/useThemeStyles";

// Styl dla mapy w modalu
const containerStyle = {
  width: "100%",
  height: "500px",
};

// Domyślne centrum mapy (np. Warszawa, Polska)
const defaultCenter = {
  lat: 52.2297,
  lng: 21.0122,
};

// Interfejs dla współrzędnych
interface Location {
  lat: number;
  lng: number;
}

// Interfejs dla danych formularza
interface FormData {
  brand: string;
  engineCapacity: string;
  fuelType: string;
  seats: string;
  carType: string;
  features: string;
  location: Location | null;
}

const AddCarPage = () => {
  const [formData, setFormData] = useState<FormData>({
    brand: "",
    engineCapacity: "",
    fuelType: "",
    seats: "",
    carType: "",
    features: "",
    location: null,
  });

  const [message, setMessage] = useState<string>("");
  const [showMapModal, setShowMapModal] = useState<boolean>(false);

  const { theme, backgroundColor, cardBackgroundColor, textColor, buttonColor, errorColor, inputBackgroundColor, borderColor, buttonBackgroundColor, buttonBorderColor } = useThemeStyles();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMapClick = (event: google.maps.MapMouseEvent) => {
    const lat = event.latLng?.lat() || 0;
    const lng = event.latLng?.lng() || 0;
    setFormData((prev) => ({
      ...prev,
      location: { lat, lng },
    }));
    setShowMapModal(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");

    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    if (!token) {
      setMessage("Błąd: Nie jesteś zalogowany. Proszę się zalogować.");
      return;
    }

    if (!formData.location) {
      setMessage("Błąd: Proszę wybrać lokalizację na mapie.");
      return;
    }

    try {
      const response = await fetch("https://localhost:5001/api/CarListings/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          brand: formData.brand,
          engineCapacity: parseFloat(formData.engineCapacity),
          fuelType: formData.fuelType,
          seats: parseInt(formData.seats),
          carType: formData.carType,
          features: formData.features ? [formData.features] : [],
          latitude: formData.location.lat,
          longitude: formData.location.lng,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add car listing");
      }

      setMessage("Ogłoszenie zostało dodane pomyślnie!");
      setFormData({
        brand: "",
        engineCapacity: "",
        fuelType: "",
        seats: "",
        carType: "",
        features: "",
        location: null,
      });
    } catch (error) {
      const err = error as Error;
      setMessage(`Błąd: ${err.message}`);
    }
  };

  useEffect(() => {
    const localToken = localStorage.getItem("token");
    const sessionToken = sessionStorage.getItem("token");
    if (localToken && !sessionToken) {
      sessionStorage.setItem("token", localToken);
    }
  }, []);

  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!googleMapsApiKey) {
    return <p className="text-danger text-center mt-3">Brak klucza API Google Maps. Sprawdź plik .env.</p>;
  }

  const inputStyle = {
    backgroundColor: inputBackgroundColor,
    color: textColor,
    borderColor,
  };

  return (
    <div className={`d-flex justify-content-center align-items-center vh-100 theme-${theme}`} style={{ backgroundColor }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="card shadow-lg p-4 rounded"
        style={{ backgroundColor: cardBackgroundColor, color: textColor, width: "400px" }}
      >
        <h1 className="text-center mb-4" style={{ color: textColor }}>Dodaj samochód</h1>
        {message && <div className={`alert ${message.includes("Błąd") ? errorColor : "alert-success"} text-center`}>{message}</div>}
        <form onSubmit={handleSubmit}>
          {/* Marka */}
          <div className="mb-3">
            <label htmlFor="brand" className="form-label" style={{ color: textColor }}>
              Marka
            </label>
            <input
              type="text"
              className="form-control rounded-pill"
              id="brand"
              name="brand"
              value={formData.brand}
              onChange={handleChange}
              placeholder="Marka"
              style={inputStyle}
              required
            />
          </div>

          {/* Pojemność silnika */}
          <div className="mb-3">
            <label htmlFor="engineCapacity" className="form-label" style={{ color: textColor }}>
              Pojemność silnika (l)
            </label>
            <input
              type="number"
              step="0.1"
              className="form-control rounded-pill"
              id="engineCapacity"
              name="engineCapacity"
              value={formData.engineCapacity}
              onChange={handleChange}
              placeholder="Pojemność silnika (l)"
              style={inputStyle}
              required
            />
          </div>

          {/* Rodzaj paliwa */}
          <div className="mb-3">
            <label htmlFor="fuelType" className="form-label" style={{ color: textColor }}>
              Wybierz rodzaj paliwa
            </label>
            <select
              className="form-select rounded-pill"
              id="fuelType"
              name="fuelType"
              value={formData.fuelType}
              onChange={handleChange}
              style={inputStyle}
              required
            >
              <option value="" disabled selected>Wybierz rodzaj paliwa</option>
              <option value="benzyna">Benzyna</option>
              <option value="diesel">Diesel</option>
              <option value="elektryczny">Elektryczny</option>
              <option value="hybryda">Hybryda</option>
            </select>
          </div>

          {/* Liczba miejsc */}
          <div className="mb-3">
            <label htmlFor="seats" className="form-label" style={{ color: textColor }}>
              Liczba miejsc
            </label>
            <input
              type="number"
              className="form-control rounded-pill"
              id="seats"
              name="seats"
              value={formData.seats}
              onChange={handleChange}
              placeholder="Liczba miejsc"
              style={inputStyle}
              required
            />
          </div>

          {/* Typ samochodu */}
          <div className="mb-3">
            <label htmlFor="carType" className="form-label" style={{ color: textColor }}>
              Wybierz typ samochodu
            </label>
            <select
              className="form-select rounded-pill"
              id="carType"
              name="carType"
              value={formData.carType}
              onChange={handleChange}
              style={inputStyle}
              required
            >
              <option value="" disabled selected>Wybierz typ samochodu</option>
              <option value="sedan">Sedan</option>
              <option value="suv">SUV</option>
              <option value="kombi">Kombi</option>
              <option value="hatchback">Hatchback</option>
              <option value="coupe">Coupe</option>
            </select>
          </div>

          {/* Dodatki */}
          <div className="mb-3">
            <label htmlFor="features" className="form-label" style={{ color: textColor }}>
              Dodatki
            </label>
            <input
              type="text"
              className="form-control rounded-pill"
              id="features"
              name="features"
              value={formData.features}
              onChange={handleChange}
              placeholder="Np. Klimatyzacja"
              style={inputStyle}
            />
          </div>

          {/* Lokalizacja */}
          <div className="mb-3">
            <motion.button
              type="button"
              className={`btn ${buttonColor} w-100 rounded-pill text-white`}
              style={{
                backgroundColor: buttonBackgroundColor,
                border: theme === "dark" ? `2px solid ${buttonBorderColor}` : undefined,
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowMapModal(true)}
            >
              Wybierz lokalizację na mapie
            </motion.button>
            {formData.location && (
              <p className="mt-2 text-center" style={{ color: textColor }}>
                Wybrana lokalizacja: Lat: {formData.location.lat.toFixed(4)}, Lng: {formData.location.lng.toFixed(4)}
              </p>
            )}
          </div>

          {/* Przycisk Dodaj ogłoszenie */}
          <div className="mb-3">
            <motion.button
              type="submit"
              className={`btn ${buttonColor} w-100 rounded-pill text-white`}
              style={{
                backgroundColor: buttonBackgroundColor,
                border: theme === "dark" ? `2px solid ${buttonBorderColor}` : undefined,
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Dodaj ogłoszenie
            </motion.button>
          </div>
        </form>

        {/* Modal z mapą */}
        <Modal show={showMapModal} onHide={() => setShowMapModal(false)} size="lg">
          <Modal.Header closeButton style={{ backgroundColor: cardBackgroundColor, color: textColor, borderColor }}>
            <Modal.Title>Wybierz lokalizację</Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ backgroundColor: cardBackgroundColor }}>
            <LoadScript googleMapsApiKey={googleMapsApiKey}>
              <GoogleMap
                mapContainerStyle={containerStyle}
                center={defaultCenter}
                zoom={10}
                onClick={handleMapClick}
              >
                {formData.location && (
                  <Marker
                    position={{ lat: formData.location.lat, lng: formData.location.lng }}
                    title={`Wybrana lokalizacja: Lat: ${formData.location.lat}, Lng: ${formData.location.lng}`}
                  />
                )}
              </GoogleMap>
            </LoadScript>
          </Modal.Body>
          <Modal.Footer style={{ backgroundColor: cardBackgroundColor, borderColor }}>
            <Button
              variant="secondary"
              onClick={() => setShowMapModal(false)}
              style={{
                backgroundColor: buttonBackgroundColor,
                border: theme === "dark" ? `2px solid ${buttonBorderColor}` : undefined,
                color: textColor,
              }}
            >
              Zamknij
            </Button>
          </Modal.Footer>
        </Modal>
      </motion.div>
    </div>
  );
};

export default AddCarPage;