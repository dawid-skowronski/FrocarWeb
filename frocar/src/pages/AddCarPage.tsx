import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import "bootstrap/dist/css/bootstrap.min.css";
import { useThemeStyles } from "../styles/useThemeStyles";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";

const containerStyle = {
  width: "100%",
  height: "400px",
};

const defaultCenter = {
  lat: 52.2297,
  lng: 21.0122,
};

interface Location {
  lat: number;
  lng: number;
}

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
  const [searchAddress, setSearchAddress] = useState<string>("");
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const mapRef = useRef<google.maps.Map | null>(null);

  const {
    theme,
    backgroundColor,
    cardBackgroundColor,
    textColor,
    buttonColor,
    errorColor, 
    inputBackgroundColor,
    borderColor,
    buttonBackgroundColor,
    buttonBorderColor,
  } = useThemeStyles();

  const navigate = useNavigate();
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const reverseGeocode = async (location: Location): Promise<string> => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.lat},${location.lng}&key=${googleMapsApiKey}`
      );
      const data = await response.json();
      if (data.status === "OK" && data.results.length > 0) {
        return data.results[0].formatted_address;
      }
      return `Szer.: ${location.lat.toFixed(4)}, Dł.: ${location.lng.toFixed(4)}`;
    } catch (error) {
      console.error("Błąd przy odwrotnym geokodowaniu:", error);
      return `Szer.: ${location.lat.toFixed(4)}, Dł.: ${location.lng.toFixed(4)}`;
    }
  };

  const handleMapClick = async (event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      const address = await reverseGeocode({ lat, lng });
      setSelectedAddress(address);
      setFormData((prev) => ({ ...prev, location: { lat, lng } }));
      setShowMapModal(false); 
    }
  };

  const geocodeAddress = async (address: string) => {
    if (!address.trim()) {
      setMessage("Błąd: Proszę wpisać adres.");
      return;
    }
    if (!googleMapsApiKey) {
      setMessage("Błąd: Brak klucza API Google Maps.");
      return;
    }
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          address
        )}&key=${googleMapsApiKey}`
      );
      if (!response.ok) {
        throw new Error(`Błąd HTTP ${response.status}: Nie udało się pobrać współrzędnych.`);
      }
      const data = await response.json();
      if (data.status !== "OK" || !data.results || data.results.length === 0) {
        throw new Error("Nie znaleziono adresu. Sprawdź wpisane dane.");
      }
      const { lat, lng } = data.results[0].geometry.location;
      setSelectedAddress(data.results[0].formatted_address);
      setFormData((prev) => ({ ...prev, location: { lat, lng } }));
      if (mapRef.current) {
        mapRef.current.panTo({ lat, lng });
      }
      setMessage("Lokalizacja ustawiona pomyślnie!");
    } catch (error) {
      setMessage(`Błąd: ${error instanceof Error ? error.message : "Nieznany błąd."}`);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFeatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFeatureInput(e.target.value);
  };

  const handleAddFeature = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (featureInput.trim()) {
        setFormData((prev) => ({
          ...prev,
          features: [...prev.features, featureInput.trim()],
        }));
        setFeatureInput("");
      }
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    geocodeAddress(searchAddress);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");

    const token = Cookies.get("token");
    if (!token) {
      setMessage("Błąd: Nie jesteś zalogowany. Przekierowuję na stronę logowania...");
      setTimeout(() => navigate("/login"), 2000);
      return;
    }

    if (!formData.location) {
      setMessage("Błąd: Proszę wybrać lokalizację na mapie.");
      return;
    }

    if (
      !formData.rentalPricePerDay ||
      parseFloat(formData.rentalPricePerDay) <= 0
    ) {
      setMessage("Błąd: Cena wynajmu za dzień musi być większa od 0.");
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
      const response = await fetch(
        "https://localhost:5001/api/CarListings/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(submitData),
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Nie udało się dodać samochodu.");
      }
      setMessage("Samochód dodany pomyślnie! Przekierowanie na stronę główną...");
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
      setSelectedAddress("");
      setTimeout(() => navigate("/"), 3000);
    } catch (error) {
      setMessage(`Błąd: ${error instanceof Error ? error.message : "Nieznany błąd."}`);
    }
  };

  if (!googleMapsApiKey) {
    return (
      <p className="text-danger text-center mt-3">
        Błąd: Brak klucza API Google Maps. Sprawdź plik .env.
      </p>
    );
  }

  const inputStyle = {
    backgroundColor: inputBackgroundColor,
    color: theme === "dark" ? "#ffffff" : "#000000",
    borderColor,
  };

  const deleteButtonStyle = {
    backgroundColor: "#dc3545",
    borderColor: "#dc3545",
    color: "white",
  };

  const getPrimaryButtonStyles = () => ({
    backgroundColor: buttonBackgroundColor,
    border: theme === "dark" ? `2px solid ${buttonBorderColor}` : undefined,
  });

  const getSecondaryButtonStyles = () => ({
    backgroundColor: theme === "dark" ? buttonBackgroundColor : "white",
    borderColor: theme === "dark" ? buttonBorderColor : "gray",
    color: theme === "dark" ? textColor : "black",
  });

  return (
    <div
      className={`d-flex justify-content-center align-items-center vh-100 theme-${theme}`}
      style={{ backgroundColor }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="card shadow-lg p-4 rounded"
        style={{
          backgroundColor: cardBackgroundColor,
          color: textColor,
          width: "100%",
          maxWidth: "1200px",
        }}
      >
        <h1 className="text-center mb-4" style={{ color: textColor }}>
          Dodaj Samochód
        </h1>

        {message && (
          <div
            className={`alert ${
              message.includes("Błąd") ? errorColor || 'alert-danger' : "alert-success"
            } text-center`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-4">
              <label
                htmlFor="brand"
                className="form-label"
                style={{ color: textColor }}
              >
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

            <div className="col-md-4">
              <label
                htmlFor="engineCapacity"
                className="form-label"
                style={{ color: textColor }}
              >
                Pojemność Silnika (L)
              </label>
              <input
                type="number"
                step="0.1"
                className="form-control rounded-pill"
                id="engineCapacity"
                name="engineCapacity"
                value={formData.engineCapacity}
                onChange={handleChange}
                placeholder="Pojemność Silnika (L)"
                style={inputStyle}
                required
              />
            </div>

            <div className="col-md-4">
              <label
                htmlFor="fuelType"
                className="form-label"
                style={{ color: textColor }}
              >
                Rodzaj Paliwa
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
                <option value="" disabled>
                  Wybierz Rodzaj Paliwa
                </option>
                <option value="Benzyna">Benzyna</option>
                <option value="Diesel">Diesel</option>
                <option value="Elektryczny">Elektryczny</option>
                <option value="Hybryda">Hybryda</option>
              </select>
            </div>

            <div className="col-md-4">
              <label
                htmlFor="seats"
                className="form-label"
                style={{ color: textColor }}
              >
                Liczba Miejsc
              </label>
              <input
                type="number"
                className="form-control rounded-pill"
                id="seats"
                name="seats"
                value={formData.seats}
                onChange={handleChange}
                placeholder="Liczba Miejsc"
                style={inputStyle}
                required
              />
            </div>

            <div className="col-md-4">
              <label
                htmlFor="carType"
                className="form-label"
                style={{ color: textColor }}
              >
                Typ Samochodu
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
                <option value="" disabled>
                  Wybierz Typ Samochodu
                </option>
                <option value="Sedan">Sedan</option>
                <option value="Suv">SUV</option>
                <option value="Kombi">Kombi</option>
                <option value="Hatchback">Hatchback</option>
                <option value="Coupe">Coupe</option>
              </select>
            </div>

            <div className="col-md-4">
              <label
                htmlFor="rentalPricePerDay"
                className="form-label"
                style={{ color: textColor }}
              >
                Cena Wynajmu za Dzień (PLN)
              </label>
              <input
                type="number"
                step="0.01"
                className="form-control rounded-pill"
                id="rentalPricePerDay"
                name="rentalPricePerDay"
                value={formData.rentalPricePerDay}
                onChange={handleChange}
                placeholder="Cena Wynajmu za Dzień (PLN)"
                style={inputStyle}
                required
              />
            </div>

            <div className="col-12">
              <label
                htmlFor="features"
                className="form-label"
                style={{ color: textColor }}
              >
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
                <div className="mt-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="mb-0" style={{ color: textColor }}>
                      Dodatki
                    </h6>
                    <h6 className="mb-0" style={{ color: textColor }}>
                      Akcje
                    </h6>
                  </div>
                  <div className="list-group">
                    {formData.features.map((feature, index) => (
                      <div
                        key={index}
                        className="list-group-item d-flex justify-content-between align-items-center"
                        style={{
                          backgroundColor:
                            theme === "dark" ? "#2c3034" : "#f8f9fa",
                          borderColor:
                            theme === "dark" ? "#495057" : "#dee2e6",
                          color: textColor,
                        }}
                      >
                        <span>{feature}</span>
                        <button
                          className="btn btn-sm"
                          onClick={() => handleRemoveFeature(index)}
                          style={deleteButtonStyle}
                        >
                          Usuń
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="col-12">
              <motion.button
                type="button"
                className={`btn ${buttonColor} w-100 rounded-pill text-white`}
                style={getPrimaryButtonStyles()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowMapModal(true)}
              >
                Wybierz Lokalizację na Mapie
              </motion.button>
              {formData.location && (
                <p className="mt-2 text-center" style={{ color: textColor }}>
                  Wybrana Lokalizacja: {selectedAddress}
                </p>
              )}
            </div>

            <div className="col-12">
              <motion.button
                type="submit"
                className={`btn ${buttonColor} w-100 rounded-pill text-white`}
                style={getPrimaryButtonStyles()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Dodaj Ogłoszenie
              </motion.button>
            </div>
          </div>
        </form>

        <Modal
          show={showMapModal}
          onHide={() => setShowMapModal(false)}
          size="lg"
        >
          <Modal.Header
            closeButton
            style={{
              backgroundColor: cardBackgroundColor,
              color: textColor,
              borderColor,
            }}
          >
            <Modal.Title>Wybierz Lokalizację</Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ backgroundColor: cardBackgroundColor }}>
            <div className="mb-3">
              <label
                htmlFor="searchAddress"
                className="form-label"
                style={{ color: textColor }}
              >
                Szukaj Adresu (np. Lubin Orla 70)
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
                style={{ backgroundColor: buttonBackgroundColor, border: theme === "dark" ? `2px solid ${buttonBorderColor}` : undefined, color: 'white' }}
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
                  mapRef.current = map;
                }}
                onClick={handleMapClick}
              >
                {formData.location && (
                  <Marker
                    position={{
                      lat: formData.location.lat,
                      lng: formData.location.lng,
                    }}
                    title={selectedAddress}
                  />
                )}
              </GoogleMap>
            </LoadScript>
          </Modal.Body>
          <Modal.Footer
            style={{ backgroundColor: cardBackgroundColor, borderColor }}
          >
            <Button
              variant="secondary"
              onClick={() => setShowMapModal(false)}
              style={getSecondaryButtonStyles()}
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