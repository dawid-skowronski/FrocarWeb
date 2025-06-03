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
import { filterByBrand, filterByAvailability, filterByFuelType, filterByMinSeats, filterByMaxPrice } from '../utils/filterStrategies';
import { applyFilters, FilterRule } from '../utils/carFilterContext';

export interface CarListing {
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
  averageRating?: number;
}

interface UsernamePayload {
  sub?: string;
}

interface ApiErrorResponse {
  message?: string;
  [key: string]: any;
}

const Maps_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const API_URL = "https://localhost:5001/api";
const CONTAINER_STYLE = { width: "100%", height: "500px" };
const ERROR_MESSAGES: Record<string, string> = {
  "401": "Sesja wygasła. Zaloguj się ponownie, aby zarządzać profilem.",
  "403": "Brak uprawnień do wykonania tej akcji.",
  "404": "Nie znaleziono danych. Spróbuj odświeżyć stronę.",
  "500": "Wystąpił problem po stronie serwera. Spróbuj ponownie później.",
  default: "Wystąpił nieoczekiwany błąd. Skontaktuj się z pomocą techniczną.",
};

const getErrorMessage = (error: any, context: string = "default"): string => {
  if (error instanceof Error) {
    try {
      const errorData = JSON.parse(error.message);
      return ERROR_MESSAGES[errorData.status] || ERROR_MESSAGES[context] || ERROR_MESSAGES.default;
    } catch {
      return ERROR_MESSAGES[error.message] || ERROR_MESSAGES[context] || ERROR_MESSAGES.default;
    }
  }
  return ERROR_MESSAGES[context] || ERROR_MESSAGES.default;
};

const getToken = (): string | null => {
  const token = Cookies.get("token");
  if (!token) return null;
  return token;
};

const decodeUsername = (token: string): string => {
  try {
    const payload: UsernamePayload = JSON.parse(atob(token.split(".")[1]));
    return payload.sub || "Nieznany użytkownik";
  } catch {
    return "";
  }
};

const reverseGeocode = async (lat: number, lng: number, apiKey: string): Promise<string> => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.status === "OK" && data.results.length > 0 ? data.results[0].formatted_address : "Adres nie wybrano";
  } catch {
    return "Nie udało się pobrać adresu.";
  }
};

export default function ProfilePage() {
  const [carListings, setCarListings] = useState<CarListing[]>([]);
  const [filteredListings, setFilteredListings] = useState<CarListing[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<CarListing | null>(null);
  const [listingToDelete, setListingToDelete] = useState<number | null>(null);
  const [featureInput, setFeatureInput] = useState("");
  const [addresses, setAddresses] = useState<{ [key: number]: string }>({});
  const [newUsername, setNewUsername] = useState("");
  const [username, setUsername] = useState("");

  const [filterBrand, setFilterBrand] = useState("");
  const [filterAvailability, setFilterAvailability] = useState<"all" | "available" | "unavailable">("all");
  const [filterFuelType, setFilterFuelType] = useState("");
  const [filterMinSeats, setFilterMinSeats] = useState<number | undefined>(undefined);
  const [filterMaxPrice, setFilterMaxPrice] = useState<number | undefined>(undefined);

  const { theme } = useTheme();
  const {
    backgroundColor,
    textColor,
    profileCardStyle,
    tableStyle,
    tableHeaderStyle,
    tableCellStyle,
    alertStyle,
    inputBackgroundColor,
    borderColor,
  } = useThemeStyles();
  const navigate = useNavigate();

  const fetchUserCarListings = async () => {
    setLoading(true);
    setMessage("");
    const token = getToken();
    if (!token) {
      setMessage(ERROR_MESSAGES["401"]);
      setTimeout(() => navigate("/login"), 2000);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/CarListings/user`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json();
        throw new Error(JSON.stringify({ status: response.status, message: errorData.message || "Nie udało się pobrać danych." }));
      }

      const data: CarListing[] = await response.json();
      const approvedListings = data.filter(car => car.isApproved);
      setCarListings(approvedListings);
      setFilteredListings(approvedListings);

      const addressResults = await Promise.all(
        approvedListings.map(async (car) => ({
          id: car.id,
          address: await reverseGeocode(car.latitude, car.longitude, Maps_API_KEY),
        }))
      );
      setAddresses(addressResults.reduce((acc, { id, address }) => ({ ...acc, [id]: address }), {}));
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleChangeUsername = async () => {
    setMessage("");
    const token = getToken();
    if (!token) {
      setMessage(ERROR_MESSAGES["401"]);
      setTimeout(() => navigate("/login"), 2000);
      return;
    }

    if (!newUsername.trim()) {
      setMessage("Proszę wpisać nową nazwę użytkownika.");
      return;
    }
    if (newUsername.length < 3) {
      setMessage("Nazwa użytkownika musi mieć co najmniej trzy znaki.");
      return;
    }
    if (/\s/.test(newUsername)) {
      setMessage("Nazwa użytkownika nie może zawierać spacji.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/account/change-username`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newUsername }),
      });
      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json();
        throw new Error(JSON.stringify({ status: response.status, message: errorData.message || "Nie udało się zmienić nazwy." }));
      }

      setUsername(newUsername);
      setNewUsername("");
      setShowUsernameModal(false);
      setMessage("Nazwa użytkownika zmieniona pomyślnie!");
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  };

  const handleDelete = async () => {
    if (!listingToDelete) return;
    const token = getToken();
    if (!token) {
      setMessage(ERROR_MESSAGES["401"]);
      setShowDeleteModal(false);
      setTimeout(() => navigate("/login"), 401);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/CarListings/${listingToDelete}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json();
        throw new Error(JSON.stringify({ status: response.status, message: errorData.message || "Nie udało się usunąć ogłoszenia." }));
      }

      setCarListings(prev => prev.filter(car => car.id !== listingToDelete));
      setFilteredListings(prev => prev.filter(car => car.id !== listingToDelete));
      setMessage("Ogłoszenie usunięte pomyślnie.");
      setShowDeleteModal(false);
      setListingToDelete(null);
    } catch (error) {
      setMessage(getErrorMessage(error));
      setShowDeleteModal(false);
    }
  };

  const toggleAvailability = async (id: number) => {
    const token = getToken();
    if (!token) {
      setMessage(ERROR_MESSAGES["401"]);
      setTimeout(() => navigate("/login"), 2000);
      return;
    }

    const listing = carListings.find(car => car.id === id);
    if (!listing) return;
    const newAvailability = !listing.isAvailable;

    try {
      const response = await fetch(`${API_URL}/CarListings/${id}/availability`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newAvailability),
      });
      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json();
        throw new Error(JSON.stringify({ status: response.status, message: errorData.message || "Nie udało się zaktualizować dostępności." }));
      }

      setCarListings(prev => prev.map(car => car.id === id ? { ...car, isAvailable: newAvailability } : car));
      setFilteredListings(prev => prev.map(car => car.id === id ? { ...car, isAvailable: newAvailability } : car));
      setMessage("Dostępność zmieniona pomyślnie!");
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedListing) return;
    const token = getToken();
    if (!token) {
      setMessage(ERROR_MESSAGES["401"]);
      setTimeout(() => navigate("/login"), 2000);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/CarListings/${selectedListing.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(selectedListing),
      });
      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json();
        throw new Error(JSON.stringify({ status: response.status, message: errorData.message || "Nie udało się zaktualizować ogłoszenia." }));
      }

      const updatedAddress = await reverseGeocode(selectedListing.latitude, selectedListing.longitude, Maps_API_KEY);
      setAddresses(prev => ({ ...prev, [selectedListing.id]: updatedAddress }));
      setCarListings(prev => prev.map(car => car.id === selectedListing.id ? selectedListing : car));
      setFilteredListings(prev => prev.map(car => car.id === selectedListing.id ? selectedListing : car));
      setMessage("Ogłoszenie zaktualizowane pomyślnie!");
      setShowEditModal(false);
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  };

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!selectedListing) return;
    const { name, value } = e.target;
    setSelectedListing({
      ...selectedListing,
      [name]: ["engineCapacity", "seats", "rentalPricePerDay"].includes(name) ? parseFloat(value) || 0 : value,
    });
  };

  const handleAddFeature = () => {
    if (!featureInput.trim() || !selectedListing) return;
    setSelectedListing({
      ...selectedListing,
      features: [...selectedListing.features, featureInput.trim()],
    });
    setFeatureInput("");
  };

  const handleFeatureKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddFeature();
    }
  };

  const handleRemoveFeature = (index: number) => {
    if (!selectedListing) return;
    setSelectedListing({
      ...selectedListing,
      features: selectedListing.features.filter((_, i) => i !== index),
    });
  };

  const handleMapClick = (event: google.maps.MapMouseEvent) => {
    if (!selectedListing || !event.latLng) return;
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    setSelectedListing({ ...selectedListing, latitude: lat, longitude: lng });
    setShowMapModal(false);
  };

  const confirmDelete = (id: number) => {
    setListingToDelete(id);
    setShowDeleteModal(true);
  };

  const handleEdit = (listing: CarListing) => {
    setSelectedListing(listing);
    setShowEditModal(true);
  };

  useEffect(() => {
    const filters: FilterRule[] = [];
    if (filterBrand) filters.push({ strategy: filterByBrand, value: filterBrand });
    if (filterAvailability !== "all") filters.push({ strategy: filterByAvailability, value: filterAvailability });
    if (filterFuelType) filters.push({ strategy: filterByFuelType, value: filterFuelType });
    if (filterMinSeats !== undefined && !isNaN(filterMinSeats)) {
      filters.push({ strategy: filterByMinSeats, value: filterMinSeats });
    }
    if (filterMaxPrice !== undefined && !isNaN(filterMaxPrice)) {
      filters.push({ strategy: filterByMaxPrice, value: filterMaxPrice });
    }

    setFilteredListings(applyFilters(carListings, filters));
  }, [filterBrand, filterAvailability, filterFuelType, filterMinSeats, filterMaxPrice, carListings]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setMessage(ERROR_MESSAGES["401"]);
      setTimeout(() => navigate("/login"), 2000);
      return;
    }
    const currentUsername = decodeUsername(token);
    if (currentUsername) {
      setUsername(currentUsername);
      fetchUserCarListings();
    } else {
      setMessage(ERROR_MESSAGES["401"]);
      setTimeout(() => navigate("/login"), 2000);
    }
  }, [navigate]);

  const inputStyle = { backgroundColor: inputBackgroundColor, color: textColor, borderColor };
  const buttonStyle = (color: string) => ({
    backgroundColor: color,
    color: "white",
    border: "none",
    padding: "10px 15px",
    borderRadius: "5px",
    cursor: "pointer",
  });

  if (!Maps_API_KEY) {
    return (
      <div className="text-center mt-3" style={{ color: textColor }} data-cy="alert-message">
        Brak konfiguracji mapy. Skontaktuj się z administratorem.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`d-flex justify-content-center align-items-center theme-${theme} p-3 p-md-4 p-lg-5`}
      style={{ backgroundColor, color: textColor, minHeight: "100vh", width: "100%" }}
      data-cy="profile-page"
    >
      <motion.div style={profileCardStyle} className="w-100 px-3 py-4 p-md-5 rounded-3 shadow-lg" data-cy="profile-card">
        <h1 className="text-center mb-4" style={{ color: textColor }} data-cy="profile-title">Twój profil</h1>
        {message && (
          <div
            className={`alert ${message.includes("pomyślnie") ? "alert-success" : "alert-danger"} text-center mb-3 rounded-pill`}
            style={alertStyle}
            role="alert"
            data-cy="alert-message"
          >
            {message}
          </div>
        )}

        <div className="mb-4" data-cy="user-info">
          <h3 style={{ color: textColor }}>Dane użytkownika</h3>
          <p><strong>Nazwa użytkownika:</strong> {username}</p>
          <div className="d-flex flex-column flex-md-row gap-2">
            <motion.button
              style={{ ...buttonStyle("#007bff"), flexGrow: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowUsernameModal(true)}
              aria-label="Zmień nazwę użytkownika"
              data-cy="change-username-button"
            >
              Zmień nazwę użytkownika
            </motion.button>
            <motion.button
              style={{ ...buttonStyle("#28a745"), flexGrow: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/rental-history")}
              aria-label="Historia wypożyczeń"
              data-cy="rental-history-button"
            >
              Zobacz historię wypożyczeń
            </motion.button>
          </div>
        </div>

        <div className="mb-4" data-cy="filter-section">
          <h4 style={{ color: textColor }}>Filtruj samochody</h4>
          <div className="d-flex flex-column flex-sm-row flex-wrap gap-3">
            <div className="flex-grow-1 mb-2 mb-sm-0">
              <label className="form-label" style={{ color: textColor }}>Marka</label>
              <input
                type="text"
                className="form-control rounded-pill"
                value={filterBrand}
                onChange={(e) => setFilterBrand(e.target.value)}
                placeholder="Wpisz markę"
                style={inputStyle}
                aria-label="Filtruj według marki"
                data-cy="filter-brand-input"
              />
            </div>
            <div className="flex-grow-1 mb-2 mb-sm-0">
              <label className="form-label" style={{ color: textColor }}>Dostępność</label>
              <select
                className="form-control rounded-pill"
                value={filterAvailability}
                onChange={(e) => setFilterAvailability(e.target.value as "all" | "available" | "unavailable")}
                style={inputStyle}
                aria-label="Filtruj według dostępności"
                data-cy="filter-availability-select"
              >
                <option value="all">Wszystkie</option>
                <option value="available">Dostępne</option>
                <option value="unavailable">Niedostępne</option>
              </select>
            </div>
            <div className="flex-grow-1 mb-2 mb-sm-0">
              <label className="form-label" style={{ color: textColor }}>Rodzaj paliwa</label>
              <select
                className="form-control rounded-pill"
                value={filterFuelType}
                onChange={(e) => setFilterFuelType(e.target.value)}
                style={inputStyle}
                aria-label="Filtruj według rodzaju paliwa"
                data-cy="filter-fuel-type-select"
              >
                <option value="">Wszystkie</option>
                <option value="benzyna">Benzyna</option>
                <option value="diesel">Diesel</option>
                <option value="elektryczny">Elektryczny</option>
                <option value="hybryda">Hybryda</option>
              </select>
            </div>
            <div className="flex-grow-1 mb-2 mb-sm-0">
              <label className="form-label" style={{ color: textColor }}>Min. miejsc</label>
              <input
                type="number"
                className="form-control rounded-pill"
                value={filterMinSeats ?? ""}
                onChange={(e) => setFilterMinSeats(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                placeholder="Min. miejsca"
                style={inputStyle}
                aria-label="Filtruj według minimalnej liczby miejsc"
                data-cy="filter-min-seats-input"
              />
            </div>
            <div className="flex-grow-1 mb-2 mb-sm-0">
              <label className="form-label" style={{ color: textColor }}>Max. cena/dzień</label>
              <input
                type="number"
                step="0.01"
                className="form-control rounded-pill"
                value={filterMaxPrice ?? ""}
                onChange={(e) => setFilterMaxPrice(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                placeholder="Max. cena"
                style={inputStyle}
                aria-label="Filtruj według maksymalnej ceny za dzień"
                data-cy="filter-max-price-input"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center" data-cy="loading-spinner">
            <div className="spinner-border" style={{ color: textColor }} role="status">
              <span className="visually-hidden">Ładowanie...</span>
            </div>
          </div>
        ) : filteredListings.length === 0 ? (
          <p className="text-center" style={{ color: textColor }} data-cy="no-listings-message">
            {carListings.length === 0
              ? "Nie masz jeszcze żadnych zatwierdzonych samochodów."
              : "Brak samochodów pasujących do filtrów."}
          </p>
        ) : (
          <>
            <div className="table-responsive d-none d-md-block" data-cy="listings-table-desktop">
              <table style={tableStyle} className="w-100">
                <thead>
                  <tr style={tableHeaderStyle}>
                    <th style={tableCellStyle}>Marka</th>
                    <th style={tableCellStyle} className="d-none d-lg-table-cell">Pojemność silnika (l)</th>
                    <th style={tableCellStyle}>Rodzaj paliwa</th>
                    <th style={tableCellStyle} className="d-none d-lg-table-cell">Liczba miejsc</th> 
                    <th style={tableCellStyle} className="d-none d-xl-table-cell">Typ samochodu</th>
                    <th style={tableCellStyle} className="d-none d-xl-table-cell">Dodatki</th> 
                    <th style={tableCellStyle}>Lokalizacja</th>
                    <th style={tableCellStyle}>Cena/dzień (zł)</th>
                    <th style={tableCellStyle}>Dostępność</th>
                    <th style={tableCellStyle}>Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredListings.map((car) => (
                    <tr key={car.id} data-cy={`listing-row-${car.id}`}>
                      <td style={tableCellStyle}>{car.brand}</td>
                      <td style={tableCellStyle} className="d-none d-lg-table-cell">{car.engineCapacity.toFixed(1)}</td>
                      <td style={tableCellStyle}>{car.fuelType}</td>
                      <td style={tableCellStyle} className="d-none d-lg-table-cell">{car.seats}</td>
                      <td style={tableCellStyle} className="d-none d-xl-table-cell">{car.carType}</td>
                      <td style={tableCellStyle} className="d-none d-xl-table-cell">{car.features.join(", ") || "Brak"}</td>
                      <td style={tableCellStyle}>{addresses[car.id] || "Ładowanie adresu..."}</td>
                      <td style={tableCellStyle}>{car.rentalPricePerDay}</td>
                      <td style={tableCellStyle}>
                        <motion.button
                          style={buttonStyle(car.isAvailable ? "#28a745" : "#dc3545")}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => toggleAvailability(car.id)}
                          aria-label={car.isAvailable ? "Ustaw jako niedostępny" : "Ustaw jako dostępny"}
                          data-cy={`toggle-availability-button-${car.id}`}
                        >
                          {car.isAvailable ? "Dostępny" : "Niedostępny"}
                        </motion.button>
                      </td>
                      <td style={tableCellStyle}>
                        <div className="d-flex flex-column flex-xl-row gap-1">
                          <motion.button
                            style={{ ...buttonStyle("#007bff"), flexGrow: 1 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleEdit(car)}
                            aria-label="Edytuj ogłoszenie"
                            data-cy={`edit-button-${car.id}`}
                          >
                            Edytuj
                          </motion.button>
                          <motion.button
                            style={{ ...buttonStyle("#dc3545"), flexGrow: 1 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => confirmDelete(car.id)}
                            aria-label="Usuń ogłoszenie"
                            data-cy={`delete-button-${car.id}`}
                          >
                            Usuń
                          </motion.button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="d-md-none mt-4" data-cy="listings-cards-mobile">
              {filteredListings.map((car) => (
                <div key={car.id} className="card mb-3" style={{ backgroundColor: profileCardStyle.backgroundColor, borderColor, color: textColor }} data-cy={`listing-card-${car.id}`}>
                  <div className="card-body">
                    <h5 className="card-title" style={{ color: textColor }}>{car.brand}</h5>
                    <p className="card-text mb-1"><strong style={{ color: textColor }}>Lokalizacja:</strong> {addresses[car.id] || "Ładowanie adresu..."}</p>
                    <p className="card-text mb-1"><strong style={{ color: textColor }}>Cena/dzień:</strong> {car.rentalPricePerDay} zł</p>
                    <p className="card-text mb-1"><strong style={{ color: textColor }}>Rodzaj paliwa:</strong> {car.fuelType}</p>
                    <p className="card-text mb-1"><strong style={{ color: textColor }}>Pojemność silnika:</strong> {car.engineCapacity.toFixed(1)} l</p>
                    <p className="card-text mb-1"><strong style={{ color: textColor }}>Liczba miejsc:</strong> {car.seats}</p>
                    <p className="card-text mb-1"><strong style={{ color: textColor }}>Typ samochodu:</strong> {car.carType}</p>
                    <p className="card-text mb-2"><strong style={{ color: textColor }}>Dodatki:</strong> {car.features.join(", ") || "Brak"}</p>

                    <div className="d-flex flex-column gap-2 mt-3">
                      <motion.button
                        style={buttonStyle(car.isAvailable ? "#28a745" : "#dc3545")}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleAvailability(car.id)}
                        aria-label={car.isAvailable ? "Ustaw jako niedostępny" : "Ustaw jako dostępny"}
                        data-cy={`toggle-availability-button-card-${car.id}`}
                      >
                        {car.isAvailable ? "Dostępny" : "Niedostępny"}
                      </motion.button>
                      <motion.button
                        style={buttonStyle("#007bff")}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleEdit(car)}
                        aria-label="Edytuj ogłoszenie"
                        data-cy={`edit-button-card-${car.id}`}
                      >
                        Edytuj
                      </motion.button>
                      <motion.button
                        style={buttonStyle("#dc3545")}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => confirmDelete(car.id)}
                        aria-label="Usuń ogłoszenie"
                        data-cy={`delete-button-card-${car.id}`}
                      >
                        Usuń
                      </motion.button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <Modal show={showUsernameModal} onHide={() => setShowUsernameModal(false)} dialogClassName={`theme-${theme}`} data-cy="username-modal" className="modal-dialog-scrollable">
          <Modal.Header closeButton style={{ backgroundColor: profileCardStyle.backgroundColor, color: textColor }}>
            <Modal.Title>Zmień nazwę użytkownika</Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ backgroundColor: profileCardStyle.backgroundColor }}>
            <div className="mb-3">
              <label className="form-label" style={{ color: textColor }}>Nowa nazwa użytkownika</label>
              <input
                type="text"
                className="form-control rounded-pill"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Wpisz nową nazwę użytkownika"
                style={inputStyle}
                aria-label="Nowa nazwa użytkownika"
                data-cy="new-username-input"
              />
            </div>
          </Modal.Body>
          <Modal.Footer style={{ backgroundColor: profileCardStyle.backgroundColor }}>
            <Button variant="secondary" onClick={() => setShowUsernameModal(false)} aria-label="Anuluj" data-cy="username-cancel-button">Anuluj</Button>
            <Button variant="primary" onClick={handleChangeUsername} aria-label="Zapisz nazwę użytkownika" data-cy="username-save-button">Zapisz</Button>
          </Modal.Footer>
        </Modal>

        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} dialogClassName={`theme-${theme}`} data-cy="delete-modal" className="modal-dialog-scrollable">
          <Modal.Header closeButton style={{ backgroundColor: profileCardStyle.backgroundColor, color: textColor }}>
            <Modal.Title>Potwierdź usunięcie</Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ backgroundColor: profileCardStyle.backgroundColor }}>
            <p style={{ color: textColor }} data-cy="delete-confirmation-message">Czy na pewno chcesz usunąć to ogłoszenie? Tej akcji nie można cofnąć.</p>
          </Modal.Body>
          <Modal.Footer style={{ backgroundColor: profileCardStyle.backgroundColor }}>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)} aria-label="Anuluj" data-cy="delete-cancel-button">Anuluj</Button>
            <Button variant="danger" onClick={handleDelete} aria-label="Usuń ogłoszenie" data-cy="delete-confirm-button">Usuń</Button>
          </Modal.Footer>
        </Modal>

        {selectedListing && (
          <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg" dialogClassName={`theme-${theme}`} data-cy="edit-modal" className="modal-dialog-scrollable">
            <Modal.Header closeButton style={{ backgroundColor: profileCardStyle.backgroundColor, color: textColor }}>
              <Modal.Title>Edytuj ogłoszenie</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ backgroundColor: profileCardStyle.backgroundColor }}>
              <div className="mb-3">
                <label className="form-label" style={{ color: textColor }}>Marka</label>
                <input
                  type="text"
                  className="form-control rounded-pill"
                  name="brand"
                  value={selectedListing.brand}
                  onChange={handleFieldChange}
                  style={inputStyle}
                  aria-label="Marka samochodu"
                  data-cy="edit-brand-input"
                />
              </div>
              <div className="mb-3">
                <label className="form-label" style={{ color: textColor }}>Pojemność silnika (l)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-control rounded-pill"
                  name="engineCapacity"
                  value={selectedListing.engineCapacity}
                  onChange={handleFieldChange}
                  style={inputStyle}
                  aria-label="Pojemność silnika"
                  data-cy="edit-engine-capacity-input"
                />
              </div>
              <div className="mb-3">
                <label className="form-label" style={{ color: textColor }}>Rodzaj paliwa</label>
                <select
                  className="form-control rounded-pill"
                  name="fuelType"
                  value={selectedListing.fuelType}
                  onChange={handleFieldChange}
                  style={inputStyle}
                  aria-label="Rodzaj paliwa"
                  data-cy="edit-fuel-type-select"
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
                  className="form-control rounded-pill"
                  name="seats"
                  value={selectedListing.seats}
                  onChange={handleFieldChange}
                  style={inputStyle}
                  aria-label="Liczba miejsc"
                  data-cy="edit-seats-input"
                />
              </div>
              <div className="mb-3">
                <label className="form-label" style={{ color: textColor }}>Typ samochodu</label>
                <select
                  className="form-control rounded-pill"
                  name="carType"
                  value={selectedListing.carType}
                  onChange={handleFieldChange}
                  style={inputStyle}
                  aria-label="Typ samochodu"
                  data-cy="edit-car-type-select"
                >
                  <option value="sedan">Sedan</option>
                  <option value="suv">SUV</option>
                  <option value="kombi">Kombi</option>
                  <option value="hatchback">Hatchback</option>
                  <option value="coupe">Coupe</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label" style={{ color: textColor }}>Dodatki</label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control rounded-pill"
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    onKeyDown={handleFeatureKeyDown}
                    placeholder="Wpisz dodatek"
                    style={inputStyle}
                    aria-label="Dodaj nowy dodatek"
                    data-cy="edit-feature-input"
                  />
                  <Button variant="primary" onClick={handleAddFeature} aria-label="Dodaj dodatek" data-cy="add-feature-button">Dodaj</Button>
                </div>
                {selectedListing.features.length > 0 && (
                  <ul className="mt-2 list-unstyled" data-cy="features-list">
                    {selectedListing.features.map((feature, index) => (
                      <li key={index} className="d-flex justify-content-between align-items-center my-1">
                        <span style={{ color: textColor }}>{feature}</span>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleRemoveFeature(index)}
                          aria-label={`Usuń dodatek ${feature}`}
                          data-cy={`remove-feature-button-${index}`}
                        >
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
                  className="form-control rounded-pill"
                  name="rentalPricePerDay"
                  value={selectedListing.rentalPricePerDay}
                  onChange={handleFieldChange}
                  style={inputStyle}
                  aria-label="Cena wynajmu na dzień"
                  data-cy="edit-rental-price-input"
                />
              </div>
              <div className="mb-3">
                <label className="form-label" style={{ color: textColor }}>Lokalizacja (kliknij na mapie)</label>
                <input
                  type="text"
                  className="form-control rounded-pill mb-2"
                  value={addresses[selectedListing.id] || "Wybierz na mapie..."}
                  readOnly
                  style={inputStyle}
                  aria-label="Wybrana lokalizacja"
                  data-cy="edit-location-input"
                />
                <Button variant="info" onClick={() => setShowMapModal(true)} aria-label="Otwórz mapę" data-cy="open-map-button">Otwórz mapę</Button>
              </div>
            </Modal.Body>
            <Modal.Footer style={{ backgroundColor: profileCardStyle.backgroundColor }}>
              <Button variant="secondary" onClick={() => setShowEditModal(false)} aria-label="Anuluj" data-cy="edit-cancel-button">Anuluj</Button>
              <Button variant="primary" onClick={handleSaveEdit} aria-label="Zapisz zmiany" data-cy="edit-save-button">Zapisz zmiany</Button>
            </Modal.Footer>
          </Modal>
        )}

        {showMapModal && selectedListing && (
          <Modal show={showMapModal} onHide={() => setShowMapModal(false)} size="lg" dialogClassName={`theme-${theme}`} data-cy="map-modal" className="modal-dialog-scrollable">
            <Modal.Header closeButton style={{ backgroundColor: profileCardStyle.backgroundColor, color: textColor }}>
              <Modal.Title>Wybierz lokalizację na mapie</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ backgroundColor: profileCardStyle.backgroundColor, minHeight: "500px" }}>
              <LoadScript googleMapsApiKey={Maps_API_KEY}>
                <GoogleMap
                  mapContainerStyle={CONTAINER_STYLE}
                  center={{ lat: selectedListing.latitude, lng: selectedListing.longitude }}
                  zoom={10}
                  onClick={handleMapClick}
                >
                  <Marker position={{ lat: selectedListing.latitude, lng: selectedListing.longitude }} />
                </GoogleMap>
              </LoadScript>
            </Modal.Body>
            <Modal.Footer style={{ backgroundColor: profileCardStyle.backgroundColor }}>
              <Button variant="secondary" onClick={() => setShowMapModal(false)} aria-label="Zamknij mapę" data-cy="map-close-button">Zamknij</Button>
            </Modal.Footer>
          </Modal>
        )}
      </motion.div>
    </motion.div>
  );
}