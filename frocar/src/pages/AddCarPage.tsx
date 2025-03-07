import { motion } from "framer-motion";

import { useState, useEffect } from "react";
import {
  GoogleMap,
  LoadScript,
  Marker,
} from "@react-google-maps/api";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";

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
  features: string; // Zmieniono z "extras" na "features"
  location: Location | null; // Przechowuje współrzędne przed wysłaniem
}

const AddCarPage = () => {
  // State to manage form inputs
  const [formData, setFormData] = useState<FormData>({
    brand: "",
    engineCapacity: "",
    fuelType: "",
    seats: "",
    carType: "",
    features: "", // Zmieniono z "extras"
    location: null,
  });

  // State for error or success messages
  const [message, setMessage] = useState<string>("");

  // State for modal visibility
  const [showMapModal, setShowMapModal] = useState<boolean>(false);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle map click to select location
  const handleMapClick = (event: google.maps.MapMouseEvent) => {
    const lat = event.latLng?.lat() || 0;
    const lng = event.latLng?.lng() || 0;
    setFormData((prev) => ({
      ...prev,
      location: { lat, lng },
    }));
    setShowMapModal(false); // Zamknij modal po wybraniu lokalizacji
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(""); // Clear previous messages

    // Get token from sessionStorage first, fallback to localStorage
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    if (!token) {
      setMessage("Błąd: Nie jesteś zalogowany. Proszę się zalogować.");
      return;
    }

    // Sprawdź, czy lokalizacja została wybrana
    if (!formData.location) {
      setMessage("Błąd: Proszę wybrać lokalizację na mapie.");
      return;
    }

    try {
      const response = await fetch("https://localhost:5001/api/CarListings/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Use the retrieved token
        },
        body: JSON.stringify({
          brand: formData.brand,
          engineCapacity: parseFloat(formData.engineCapacity), // Convert to float
          fuelType: formData.fuelType,
          seats: parseInt(formData.seats), // Convert to integer
          carType: formData.carType,
          features: formData.features ? [formData.features] : [], // Konwersja stringa na listę
          latitude: formData.location.lat, // Wysyłamy jako oddzielne pola
          longitude: formData.location.lng,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add car listing");
      }

      const result = await response.json(); // Kept for potential future use
      setMessage("Ogłoszenie zostało dodane pomyślnie!");
      setFormData({
        brand: "",
        engineCapacity: "",
        fuelType: "",
        seats: "",
        carType: "",
        features: "",
        location: null,
      }); // Reset form
    } catch (error) {
      const err = error as Error;
      setMessage(`Błąd: ${err.message}`);
    }
  };

  // Effect to check and sync token between session and local storage
  useEffect(() => {
    // Check if token exists in localStorage and copy to sessionStorage if needed
    const localToken = localStorage.getItem("token");
    const sessionToken = sessionStorage.getItem("token");
    if (localToken && !sessionToken) {
      sessionStorage.setItem("token", localToken);
    }
  }, []);

  // Pobieranie klucza API z import.meta.env
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!googleMapsApiKey) {
    return <p className="text-danger text-center mt-3">Brak klucza API Google Maps. Sprawdź plik .env.</p>;
  }

  return (
    
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mt-5"
      >
        <h1 className="text-center">Dodaj samochód</h1>
        {message && <div className="alert alert-info text-center">{message}</div>}
        <form onSubmit={handleSubmit} className="mt-4">
          {/* Brand */}
          <div className="mb-3">
            <label htmlFor="brand" className="form-label">
              Marka
            </label>
            <input
              type="text"
              className="form-control"
              id="brand"
              name="brand"
              value={formData.brand}
              onChange={handleChange}
              placeholder="Marka"
              required
            />
          </div>

          {/* Engine Capacity */}
          <div className="mb-3">
            <label htmlFor="engineCapacity" className="form-label">
              Pojemność silnika (l)
            </label>
            <input
              type="number"
              step="0.1"
              className="form-control"
              id="engineCapacity"
              name="engineCapacity"
              value={formData.engineCapacity}
              onChange={handleChange}
              placeholder="Pojemność silnika (l)"
              required
            />
          </div>

          {/* Fuel Type */}
          <div className="mb-3">
            <label htmlFor="fuelType" className="form-label">
              Wybierz rodzaj paliwa
            </label>
            <select
              className="form-select"
              id="fuelType"
              name="fuelType"
              value={formData.fuelType}
              onChange={handleChange}
              required
            >
              <option value="">Wybierz rodzaj paliwa</option>
              <option value="benzyna">Benzyna</option>
              <option value="diesel">Diesel</option>
              <option value="elektryczny">Elektryczny</option>
              <option value="hybryda">Hybryda</option>
            </select>
          </div>

          {/* Number of Seats */}
          <div className="mb-3">
            <label htmlFor="seats" className="form-label">
              Liczba miejsc
            </label>
            <input
              type="number"
              className="form-control"
              id="seats"
              name="seats"
              value={formData.seats}
              onChange={handleChange}
              placeholder="Liczba miejsc"
              required
            />
          </div>

          {/* Car Type */}
          <div className="mb-3">
            <label htmlFor="carType" className="form-label">
              Wybierz typ samochodu
            </label>
            <select
              className="form-select"
              id="carType"
              name="carType"
              value={formData.carType}
              onChange={handleChange}
              required
            >
              <option value="">Wybierz typ samochodu</option>
              <option value="sedan">Sedan</option>
              <option value="suv">SUV</option>
              <option value="kombi">Kombi</option>
              <option value="hatchback">Hatchback</option>
              <option value="coupe">Coupe</option>
            </select>
          </div>

          {/* Features (dawniej Extras) */}
          <div className="mb-3">
            <label htmlFor="features" className="form-label">
              Dodatki
            </label>
            <input
              type="text"
              className="form-control"
              id="features"
              name="features"
              value={formData.features}
              onChange={handleChange}
              placeholder="Np. Klimatyzacja"
            />
          </div>

          {/* Location */}
          <div className="mb-3">
            <button
              type="button"
              className="btn btn-secondary w-100"
              onClick={() => setShowMapModal(true)}
            >
              Wybierz lokalizację na mapie
            </button>
            {formData.location && (
              <p className="mt-2 text-center">
                Wybrana lokalizacja: Lat: {formData.location.lat.toFixed(4)}, Lng: {formData.location.lng.toFixed(4)}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="mb-3">
            <button type="submit" className="btn btn-success w-100">
              Dodaj ogłoszenie
            </button>
          </div>
        </form>

        {/* Modal z mapą */}
        <Modal show={showMapModal} onHide={() => setShowMapModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Wybierz lokalizację</Modal.Title>
          </Modal.Header>
          <Modal.Body>
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
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowMapModal(false)}>
              Zamknij
            </Button>
          </Modal.Footer>
        </Modal>
      </motion.div>
    
  );
};

export default AddCarPage;