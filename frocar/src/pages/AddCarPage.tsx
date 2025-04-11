import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import "bootstrap/dist/css/bootstrap.min.css";
import { useThemeStyles } from "../styles/useThemeStyles";

// Styl dla mapy w modalu
const containerStyle = {
  width: "100%",
  height: "400px", // Zmniejszone, aby zmieścić pole wyszukiwania
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
  features: string[];
  rentalPricePerDay: string;
  location: Location | null;
}

const AddCarPage = () => {
  const [formData, setFormData] = useState<FormData>({
    brand: "",
    engineCapacity: "",
    fuelType: "",
    seats: "",
    carType: "",
    features: [],
    rentalPricePerDay: "",
    location: null,
  });

  const [message, setMessage] = useState<string>("");
  const [showMapModal, setShowMapModal] = useState<boolean>(false);
  const [featureInput, setFeatureInput] = useState<string>("");
  const [searchAddress, setSearchAddress] = useState<string>(""); // Pole dla wyszukiwania adresu
  const mapRef = useRef<google.maps.Map | null>(null); // Ref do mapy

  const { theme, backgroundColor, cardBackgroundColor, textColor, buttonColor, errorColor, inputBackgroundColor, borderColor, buttonBackgroundColor, buttonBorderColor } = useThemeStyles();

  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Funkcja do zmiany danych formularza
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Funkcja do zmiany dodatków
  const handleFeatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFeatureInput(e.target.value);
  };

  // Dodawanie dodatku po naciśnięciu Enter
  const handleAddFeature = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && featureInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        features: [...prev.features, featureInput.trim()],
      }));
      setFeatureInput("");
    }
  };

  // Usuwanie dodatku
  const handleRemoveFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  // Ustawianie lokalizacji po kliknięciu na mapę
  const handleMapClick = (event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      setFormData((prev) => ({
        ...prev,
        location: { lat, lng },
      }));
      setShowMapModal(false);
    }
  };

  // Geokodowanie adresu
  const geocodeAddress = async (address: string) => {
    if (!address.trim()) {
      setMessage("Proszę wpisać adres.");
      return;
    }

    if (!googleMapsApiKey) {
      setMessage("Błąd: Brak klucza API Google Maps.");
      return;
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${googleMapsApiKey}`
      );

      if (!response.ok) {
        throw new Error(`Błąd HTTP ${response.status}: Nie udało się pobrać współrzędnych.`);
      }

      const data = await response.json();

      if (data.status !== "OK" || !data.results || data.results.length === 0) {
        throw new Error("Nie znaleziono adresu. Sprawdź poprawność nazwy.");
      }

      const { lat, lng } = data.results[0].geometry.location;
      setFormData((prev) => ({
        ...prev,
        location: { lat, lng },
      }));
      if (mapRef.current) {
        mapRef.current.panTo({ lat, lng });
      }
      setMessage("Lokalizacja ustawiona pomyślnie!");
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage(`Błąd: ${error.message}`);
      } else {
        setMessage("Błąd: Nieznany błąd podczas wyszukiwania adresu.");
      }
    }
  };

  // Obsługa wyszukiwania adresu
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    geocodeAddress(searchAddress);
  };

  // Wysyłanie formularza
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

    if (!formData.rentalPricePerDay || parseFloat(formData.rentalPricePerDay) <= 0) {
      setMessage("Błąd: Cena wynajmu na dzień musi być większa od 0.");
      return;
    }

    const submitData = {
      brand: formData.brand,
      engineCapacity: parseFloat(formData.engineCapacity),
      fuelType: formData.fuelType,
      seats: parseInt(formData.seats),
      carType: formData.carType,
      features: [...formData.features],
      rentalPricePerDay: parseFloat(formData.rentalPricePerDay),
      latitude: formData.location.lat,
      longitude: formData.location.lng,
    };

    try {
      const response = await fetch("https://localhost:5001/api/CarListings/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Nie udało się dodać ogłoszenia.");
      }

      setMessage("Ogłoszenie zostało dodane pomyślnie!");
      setFormData({
        brand: "",
        engineCapacity: "",
        fuelType: "",
        seats: "",
        carType: "",
        features: [],
        rentalPricePerDay: "",
        location: null,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage(`Błąd: ${error.message}`);
      } else {
        setMessage("Błąd: Nieznany błąd.");
      }
    }
  };

  useEffect(() => {
    const localToken = localStorage.getItem("token");
    const sessionToken = sessionStorage.getItem("token");
    if (localToken && !sessionToken) {
      sessionStorage.setItem("token", localToken);
    }
  }, []);

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
        {message && (
          <div className={`alert ${message.includes("Błąd") ? errorColor : "alert-success"} text-center`}>
            {message}
          </div>
        )}
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
              <option value="" disabled>Wybierz rodzaj paliwa</option>
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
              <option value="" disabled>Wybierz typ samochodu</option>
              <option value="sedan">Sedan</option>
              <option value="suv">SUV</option>
              <option value="kombi">Kombi</option>
              <option value="hatchback">Hatchback</option>
              <option value="coupe">Coupe</option>
            </select>
          </div>

          {/* Dodatki (Features) */}
          <div className="mb-3">
            <label htmlFor="features" className="form-label" style={{ color: textColor }}>
              Dodatki (naciśnij Enter, aby dodać)
            </label>
            <input
              type="text"
              className="form-control rounded-pill"
              id="features"
              value={featureInput}
              onChange={handleFeatureChange}
              onKeyDown={handleAddFeature}
              placeholder="Np. Klimatyzacja"
              style={inputStyle}
            />
            {formData.features.length > 0 && (
              <ul className="mt-2">
                {formData.features.map((feature, index) => (
                  <li key={index} className="d-flex justify-content-between align-items-center">
                    <span style={{ color: textColor }}>{feature}</span>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleRemoveFeature(index)}
                    >
                      Usuń
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Cena wynajmu na dzień */}
          <div className="mb-3">
            <label htmlFor="rentalPricePerDay" className="form-label" style={{ color: textColor }}>
              Cena wynajmu na dzień (zł)
            </label>
            <input
              type="number"
              step="0.01"
              className="form-control rounded-pill"
              id="rentalPricePerDay"
              name="rentalPricePerDay"
              value={formData.rentalPricePerDay}
              onChange={handleChange}
              placeholder="Cena wynajmu na dzień (zł)"
              style={inputStyle}
              required
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

        {/* Modal z mapą i polem wyszukiwania */}
        <Modal show={showMapModal} onHide={() => setShowMapModal(false)} size="lg">
          <Modal.Header closeButton style={{ backgroundColor: cardBackgroundColor, color: textColor, borderColor }}>
            <Modal.Title>Wybierz lokalizację</Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ backgroundColor: cardBackgroundColor }}>
            {/* Pole wyszukiwania w modalu */}
            <div className="mb-3">
              <label htmlFor="searchAddress" className="form-label" style={{ color: textColor }}>
                Wyszukaj adres (np. Lubin Orla 70)
              </label>
              <div className="input-group">
                <input
                  type="text"
                  className="form-control rounded-pill"
                  id="searchAddress"
                  value={searchAddress}
                  onChange={(e) => setSearchAddress(e.target.value)}
                  placeholder="Wpisz adres"
                  style={inputStyle}
                />
                <Button
                  variant={buttonColor}
                  style={{
                    backgroundColor: buttonBackgroundColor,
                    border: theme === "dark" ? `2px solid ${buttonBorderColor}` : undefined,
                  }}
                  onClick={handleSearch}
                >
                  Szukaj
                </Button>
              </div>
            </div>

            <LoadScript googleMapsApiKey={googleMapsApiKey}>
              <GoogleMap
                mapContainerStyle={containerStyle}
                center={formData.location || defaultCenter}
                zoom={10}
                onLoad={(map) => {
                  mapRef.current = map; // Przypisanie mapy do ref bez zwracania wartości
                }}
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