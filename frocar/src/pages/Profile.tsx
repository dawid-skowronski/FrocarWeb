import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import "bootstrap/dist/css/bootstrap.min.css";
import { useThemeStyles } from "../styles/useThemeStyles";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import Cookies from "js-cookie";

const containerStyle = {
  width: "100%",
  height: "500px",
};

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

const ProfilePage = () => {
  const [carListings, setCarListings] = useState<CarListing[]>([]);
  const [filteredListings, setFilteredListings] = useState<CarListing[]>([]);
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showMapModal, setShowMapModal] = useState<boolean>(false);
  const [showUsernameModal, setShowUsernameModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [selectedListing, setSelectedListing] = useState<CarListing | null>(null);
  const [listingToDelete, setListingToDelete] = useState<number | null>(null);
  const [featureInput, setFeatureInput] = useState<string>("");
  const [addresses, setAddresses] = useState<{ [key: number]: string }>({});
  const [newUsername, setNewUsername] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [filterBrand, setFilterBrand] = useState<string>("");
  const [filterAvailability, setFilterAvailability] = useState<string>("all");

  const { theme } = useTheme();
  const {
    backgroundColor,
    textColor,
    profileCardStyle,
    tableStyle,
    tableHeaderStyle,
    tableCellStyle,
    deleteButtonStyle,
    alertStyle,
    inputBackgroundColor,
    borderColor,
  } = useThemeStyles();

  const navigate = useNavigate();
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const getUsernameFromToken = () => {
    const token = Cookies.get("token");
    if (!token) {
      setMessage("Błąd: Nie jesteś zalogowany. Przekierowuję na stronę logowania...");
      setTimeout(() => navigate("/login"), 2000);
      return "";
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.sub || "Nieznany użytkownik";
    } catch (_) {
      setMessage("Błąd: Nieprawidłowy token. Proszę zalogować się ponownie.");
      setTimeout(() => navigate("/login"), 2000);
      return "";
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleMapsApiKey}`
      );

      if (!response.ok) {
        throw new Error(`Błąd HTTP ${response.status}: Nie udało się pobrać adresu.`);
      }

      const data = await response.json();
      if (data.status !== "OK" || !data.results || data.results.length === 0) {
        return "Adres nieznany";
      }

      return data.results[0].formatted_address;
    } catch (_) {
      return "Błąd pobierania adresu";
    }
  };

  const fetchUserCarListings = async () => {
    setLoading(true);
    setMessage("");
    const token = Cookies.get("token");
    if (!token) {
      setMessage("Błąd: Nie jesteś zalogowany. Proszę się zalogować.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("https://localhost:5001/api/CarListings/user", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Nie udało się pobrać listy samochodów.");
      }

      const data: CarListing[] = await response.json();
      const approvedListings = data.filter(car => car.isApproved);
      setCarListings(approvedListings);
      setFilteredListings(approvedListings);

      const addressPromises = approvedListings.map((car) =>
        reverseGeocode(car.latitude, car.longitude).then((address) => ({
          id: car.id,
          address,
        }))
      );
      const addressResults = await Promise.all(addressPromises);
      const newAddresses = addressResults.reduce((acc, { id, address }) => {
        acc[id] = address;
        return acc;
      }, {} as { [key: number]: string });
      setAddresses(newAddresses);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage(`Błąd: ${error.message}`);
      } else {
        setMessage("Błąd: Nieznany błąd.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChangeUsername = async () => {
    setMessage("");
    const token = Cookies.get("token");
    if (!token) {
      setMessage("Błąd: Nie jesteś zalogowany. Proszę się zalogować.");
      return;
    }

    if (!newUsername.trim()) {
      setMessage("Błąd: Nazwa użytkownika nie może być pusta.");
      return;
    }
    if (newUsername.length < 3) {
      setMessage("Błąd: Nazwa użytkownika musi mieć co najmniej 3 znaki.");
      return;
    }
    if (/\s/.test(newUsername)) {
      setMessage("Błąd: Nazwa użytkownika nie może zawierać spacji.");
      return;
    }

    try {
      const response = await fetch("https://localhost:5001/api/account/change-username", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newUsername }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Nie udało się zmienić nazwy użytkownika.");
      }

      setUsername(newUsername);
      setNewUsername("");
      setShowUsernameModal(false);
      setMessage("Nazwa użytkownika zmieniona pomyślnie!");
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage(`Błąd: ${error.message}`);
      } else {
        setMessage("Błąd: Nieznany błąd.");
      }
    }
  };

  const confirmDelete = (id: number) => {
    setListingToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!listingToDelete) return;

    setMessage("");
    const token = Cookies.get("token");
    if (!token) {
      setMessage("Błąd: Nie jesteś zalogowany. Proszę się zalogować.");
      setShowDeleteModal(false);
      return;
    }

    try {
      const response = await fetch(`https://localhost:5001/api/CarListings/${listingToDelete}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Nie udało się usunąć samochodu.");
      }

      setCarListings(carListings.filter((car) => car.id !== listingToDelete));
      setFilteredListings(filteredListings.filter((car) => car.id !== listingToDelete));
      setMessage("Samochód został usunięty pomyślnie.");
      setShowDeleteModal(false);
      setListingToDelete(null);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage(`Błąd: ${error.message}`);
      } else {
        setMessage("Błąd: Nieznany błąd.");
      }
      setShowDeleteModal(false);
    }
  };

  const toggleAvailability = async (id: number) => {
    setMessage("");
    const token = Cookies.get("token");
    if (!token) {
      setMessage("Błąd: Nie jesteś zalogowany. Proszę się zalogować.");
      return;
    }

    const newAvailability = !carListings.find((car) => car.id === id)?.isAvailable;
    try {
      const response = await fetch(`https://localhost:5001/api/CarListings/${id}/availability`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newAvailability),
      });

      if (!response.ok) {
        throw new Error("Nie udało się zaktualizować dostępności.");
      }

      setCarListings((prevListings) =>
        prevListings.map((car) =>
          car.id === id ? { ...car, isAvailable: newAvailability } : car
        )
      );
      setFilteredListings((prevListings) =>
        prevListings.map((car) =>
          car.id === id ? { ...car, isAvailable: newAvailability } : car
        )
      );
      setMessage("Dostępność zmieniona pomyślnie!");
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage(`Błąd: ${error.message}`);
      } else {
        setMessage("Błąd: Nieznany błąd.");
      }
    }
  };

  const handleEdit = (listing: CarListing) => {
    setSelectedListing(listing);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedListing) return;

    const token = Cookies.get("token");
    try {
      const response = await fetch(`https://localhost:5001/api/CarListings/${selectedListing.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(selectedListing),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Nie udało się zaktualizować ogłoszenia.");
      }

      const updatedAddress = await reverseGeocode(selectedListing.latitude, selectedListing.longitude);
      setAddresses((prev) => ({ ...prev, [selectedListing.id]: updatedAddress }));
      setMessage("Ogłoszenie zaktualizowane pomyślnie!");
      setShowEditModal(false);
      fetchUserCarListings();
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage(`Błąd: ${error.message}`);
      } else {
        setMessage("Błąd: Nieznany błąd.");
      }
    }
  };

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!selectedListing) return;
    const { name, value } = e.target;
    setSelectedListing({
      ...selectedListing,
      [name]: name === "engineCapacity" || name === "seats" || name === "rentalPricePerDay" ? parseFloat(value) : value,
    });
  };

  const handleAddFeature = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && featureInput.trim() && selectedListing) {
      setSelectedListing({
        ...selectedListing,
        features: [...selectedListing.features, featureInput.trim()],
      });
      setFeatureInput("");
    }
  };

  const handleRemoveFeature = (index: number) => {
    if (selectedListing) {
      setSelectedListing({
        ...selectedListing,
        features: selectedListing.features.filter((_, i) => i !== index),
      });
    }
  };

  const handleMapClick = (event: google.maps.MapMouseEvent) => {
    const lat = event.latLng?.lat() || 0;
    const lng = event.latLng?.lng() || 0;
    if (selectedListing) {
      setSelectedListing({
        ...selectedListing,
        latitude: lat,
        longitude: lng,
      });
      setShowMapModal(false);
    }
  };

  useEffect(() => {
    let filtered = carListings;
    if (filterBrand) {
      filtered = filtered.filter((car) =>
        car.brand.toLowerCase().includes(filterBrand.toLowerCase())
      );
    }
    if (filterAvailability !== "all") {
      filtered = filtered.filter((car) =>
        filterAvailability === "available" ? car.isAvailable : !car.isAvailable
      );
    }
    setFilteredListings(filtered);
  }, [filterBrand, filterAvailability, carListings]);

  useEffect(() => {
    const currentUsername = getUsernameFromToken();
    if (currentUsername) {
      setUsername(currentUsername);
      fetchUserCarListings();
    }
  }, []);

  const inputStyle = {
    backgroundColor: inputBackgroundColor,
    color: textColor,
    borderColor,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`d-flex justify-content-center align-items-center theme-${theme}`}
      style={{ backgroundColor, color: textColor, minHeight: "100vh", width: "100%", margin: 0, padding: 0 }}
    >
      <motion.div style={profileCardStyle}>
        <h1 className="text-center mb-4" style={{ color: textColor }}>Twój profil</h1>
        {message && <div className="text-center" style={alertStyle}>{message}</div>}

        <div className="mb-4">
          <h3 style={{ color: textColor }}>Dane użytkownika</h3>
          <p>
            <strong>Nazwa użytkownika:</strong> {username}
          </p>
          <motion.button
            style={{
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              padding: "5px 10px",
              borderRadius: "5px",
              cursor: "pointer",
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowUsernameModal(true)}
          >
            Zmień nazwę użytkownika
          </motion.button>
        </div>

        <div className="mb-4">
          <h4 style={{ color: textColor }}>Filtruj samochody</h4>
          <div className="d-flex gap-3">
            <div>
              <label className="form-label" style={{ color: textColor }}>
                Marka
              </label>
              <input
                type="text"
                className="form-control"
                value={filterBrand}
                onChange={(e) => setFilterBrand(e.target.value)}
                placeholder="Wpisz markę"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="form-label" style={{ color: textColor }}>
                Dostępność
              </label>
              <select
                className="form-control"
                value={filterAvailability}
                onChange={(e) => setFilterAvailability(e.target.value)}
                style={inputStyle}
              >
                <option value="all">Wszystkie</option>
                <option value="available">Dostępne</option>
                <option value="unavailable">Niedostępne</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center">
            <div className="spinner-border" style={{ color: textColor }} role="status">
              <span className="visually-hidden">Ładowanie...</span>
            </div>
          </div>
        ) : filteredListings.length === 0 ? (
          <p className="text-center" style={{ color: textColor }}>
            {carListings.length === 0
              ? "Nie masz jeszcze żadnych zatwierdzonych samochodów."
              : "Brak samochodów pasujących do filtrów."}
          </p>
        ) : (
          <div className="table-responsive">
            <table style={tableStyle}>
              <thead>
                <tr style={tableHeaderStyle}>
                  <th style={tableCellStyle}>Marka</th>
                  <th style={tableCellStyle}>Pojemność silnika (l)</th>
                  <th style={tableCellStyle}>Rodzaj paliwa</th>
                  <th style={tableCellStyle}>Liczba miejsc</th>
                  <th style={tableCellStyle}>Typ samochodu</th>
                  <th style={tableCellStyle}>Dodatki</th>
                  <th style={tableCellStyle}>Lokalizacja</th>
                  <th style={tableCellStyle}>Cena/dzień (zł)</th>
                  <th style={tableCellStyle}>Dostępność</th>
                  <th style={tableCellStyle}>Akcje</th>
                </tr>
              </thead>
              <tbody>
                {filteredListings.map((car) => (
                  <tr key={car.id}>
                    <td style={tableCellStyle}>{car.brand}</td>
                    <td style={tableCellStyle}>{car.engineCapacity.toFixed(1)}</td>
                    <td style={tableCellStyle}>{car.fuelType}</td>
                    <td style={tableCellStyle}>{car.seats}</td>
                    <td style={tableCellStyle}>{car.carType}</td>
                    <td style={tableCellStyle}>{car.features.join(", ") || "Brak"}</td>
                    <td style={tableCellStyle}>{addresses[car.id] || "Ładowanie adresu..."}</td>
                    <td style={tableCellStyle}>{car.rentalPricePerDay}</td>
                    <td style={tableCellStyle}>
                      <motion.button
                        style={{
                          backgroundColor: car.isAvailable ? "#28a745" : "#dc3545",
                          color: "white",
                          border: "none",
                          padding: "5px 10px",
                          borderRadius: "5px",
                          cursor: "pointer",
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleAvailability(car.id)}
                      >
                        {car.isAvailable ? "Dostępny" : "Niedostępny"}
                      </motion.button>
                    </td>
                    <td style={tableCellStyle}>
                      <motion.button
                        style={{ ...deleteButtonStyle, backgroundColor: "#007bff", marginRight: "5px" }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleEdit(car)}
                      >
                        Edytuj
                      </motion.button>
                      <motion.button
                        style={deleteButtonStyle}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => confirmDelete(car.id)}
                      >
                        Usuń
                      </motion.button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Modal
          show={showUsernameModal}
          onHide={() => setShowUsernameModal(false)}
          dialogClassName={`theme-${theme}`}
        >
          <Modal.Header closeButton style={{ backgroundColor: profileCardStyle.backgroundColor, color: textColor }}>
            <Modal.Title>Zmień nazwę użytkownika</Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ backgroundColor: profileCardStyle.backgroundColor }}>
            <div className="mb-3">
              <label className="form-label" style={{ color: textColor }}>
                Nowa nazwa użytkownika
              </label>
              <input
                type="text"
                className="form-control"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Wpisz nową nazwę użytkownika"
                style={inputStyle}
              />
            </div>
          </Modal.Body>
          <Modal.Footer style={{ backgroundColor: profileCardStyle.backgroundColor }}>
            <Button variant="secondary" onClick={() => setShowUsernameModal(false)}>
              Anuluj
            </Button>
            <Button variant="primary" onClick={handleChangeUsername}>
              Zapisz
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal
          show={showDeleteModal}
          onHide={() => setShowDeleteModal(false)}
          dialogClassName={`theme-${theme}`}
        >
          <Modal.Header closeButton style={{ backgroundColor: profileCardStyle.backgroundColor, color: textColor }}>
            <Modal.Title>Potwierdź usunięcie</Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ backgroundColor: profileCardStyle.backgroundColor }}>
            <p style={{ color: textColor }}>Czy na pewno chcesz usunąć to ogłoszenie? Tej akcji nie można cofnąć.</p>
          </Modal.Body>
          <Modal.Footer style={{ backgroundColor: profileCardStyle.backgroundColor }}>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Anuluj
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Usuń
            </Button>
          </Modal.Footer>
        </Modal>

        {selectedListing && (
          <Modal
            show={showEditModal}
            onHide={() => setShowEditModal(false)}
            size="lg"
            dialogClassName={`theme-${theme}`}
          >
            <Modal.Header closeButton style={{ backgroundColor: profileCardStyle.backgroundColor, color: textColor }}>
              <Modal.Title>Edytuj ogłoszenie</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ backgroundColor: profileCardStyle.backgroundColor }}>
              <div className="mb-3">
                <label className="form-label" style={{ color: textColor }}>Marka</label>
                <input
                  type="text"
                  className="form-control"
                  name="brand"
                  value={selectedListing.brand}
                  onChange={handleFieldChange}
                  style={inputStyle}
                />
              </div>
              <div className="mb-3">
                <label className="form-label" style={{ color: textColor }}>Pojemność silnika (l)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-control"
                  name="engineCapacity"
                  value={selectedListing.engineCapacity}
                  onChange={handleFieldChange}
                  style={inputStyle}
                />
              </div>
              <div className="mb-3">
                <label className="form-label" style={{ color: textColor }}>Rodzaj paliwa</label>
                <select
                  className="form-control"
                  name="fuelType"
                  value={selectedListing.fuelType}
                  onChange={handleFieldChange}
                  style={inputStyle}
                >
                  <option value="benzyna">Benzyna</option>
                  <option value="diesel">Diesel</option>
                  <option value="elektryczny">Elektryczny</option>
                  <option value="hybryda">Hybryda</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label" style={{ color: textColor }}>Liczba miejsc</label>
                <input
                  type="number"
                  className="form-control"
                  name="seats"
                  value={selectedListing.seats}
                  onChange={handleFieldChange}
                  style={inputStyle}
                />
              </div>
              <div className="mb-3">
                <label className="form-label" style={{ color: textColor }}>Typ samochodu</label>
                <select
                  className="form-control"
                  name="carType"
                  value={selectedListing.carType}
                  onChange={handleFieldChange}
                  style={inputStyle}
                >
                  <option value="sedan">Sedan</option>
                  <option value="suv">SUV</option>
                  <option value="kombi">Kombi</option>
                  <option value="hatchback">Hatchback</option>
                  <option value="coupe">Coupe</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label" style={{ color: textColor }}>Dodatki (Enter, aby dodać)</label>
                <input
                  type="text"
                  className="form-control"
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  onKeyDown={handleAddFeature}
                  placeholder="Wpisz dodatek"
                  style={inputStyle}
                />
                {selectedListing.features.length > 0 && (
                  <ul className="mt-2">
                    {selectedListing.features.map((feature, index) => (
                      <li key={index} className="d-flex justify-content-between align-items-center">
                        <span style={{ color: textColor }}>{feature}</span>
                        <Button variant="danger" size="sm" onClick={() => handleRemoveFeature(index)}>
                          Usuń
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="mb-3">
                <label className="form-label" style={{ color: textColor }}>Cena wynajmu na dzień (zł)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  name="rentalPricePerDay"
                  value={selectedListing.rentalPricePerDay}
                  onChange={handleFieldChange}
                  style={inputStyle}
                />
              </div>
              <div className="mb-3">
                <Button variant="primary" onClick={() => setShowMapModal(true)}>
                  Zmień lokalizację
                </Button>
                <p style={{ color: textColor }}>
                  Aktualna lokalizacja: {addresses[selectedListing.id] || "Ładowanie adresu..."}
                </p>
              </div>
            </Modal.Body>
            <Modal.Footer style={{ backgroundColor: profileCardStyle.backgroundColor }}>
              <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                Anuluj
              </Button>
              <Button variant="primary" onClick={handleSaveEdit}>
                Zapisz zmiany
              </Button>
            </Modal.Footer>
          </Modal>
        )}

        {selectedListing && (
          <Modal
            show={showMapModal}
            onHide={() => setShowMapModal(false)}
            size="lg"
            dialogClassName={`theme-${theme}`}
          >
            <Modal.Header closeButton style={{ backgroundColor: profileCardStyle.backgroundColor, color: textColor }}>
              <Modal.Title>Zmień lokalizację</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ backgroundColor: profileCardStyle.backgroundColor }}>
              <LoadScript googleMapsApiKey={googleMapsApiKey}>
                <GoogleMap
                  mapContainerStyle={containerStyle}
                  center={{ lat: selectedListing.latitude, lng: selectedListing.longitude }}
                  zoom={10}
                  onClick={handleMapClick}
                >
                  <Marker position={{ lat: selectedListing.latitude, lng: selectedListing.longitude }} />
                </GoogleMap>
              </LoadScript>
            </Modal.Body>
            <Modal.Footer style={{ backgroundColor: profileCardStyle.backgroundColor }}>
              <Button variant="secondary" onClick={() => setShowMapModal(false)}>
                Zamknij
              </Button>
            </Modal.Footer>
          </Modal>
        )}
      </motion.div>
    </motion.div>
  );
};

export default ProfilePage;