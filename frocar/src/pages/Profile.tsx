import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useThemeStyles } from "../styles/useThemeStyles";

// Interfejs dla modelu CarListing
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
}

const ProfilePage = () => {
  const [carListings, setCarListings] = useState<CarListing[]>([]);
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchUserCarListings();
  }, []);

  const fetchUserCarListings = async () => {
    setLoading(true);
    setMessage("");

    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
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
      setCarListings(data);
    } catch (error) {
      const err = error as Error;
      setMessage(`Błąd: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setMessage("");

    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    if (!token) {
      setMessage("Błąd: Nie jesteś zalogowany. Proszę się zalogować.");
      return;
    }

    try {
      const response = await fetch(`https://localhost:5001/api/CarListings/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Nie udało się usunąć samochodu.");
      }

      setCarListings(carListings.filter((car) => car.id !== id));
      setMessage("Samochód został usunięty pomyślnie.");
    } catch (error) {
      const err = error as Error;
      setMessage(`Błąd: ${err.message}`);
    }
  };

  const {
    backgroundColor,
    textColor,
    profileCardStyle, // Używamy nowego stylu
    tableStyle,
    tableHeaderStyle,
    tableCellStyle,
    deleteButtonStyle,
    alertStyle,
  } = useThemeStyles();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="d-flex justify-content-center align-items-center"
      style={{ backgroundColor, color: textColor, minHeight: "100vh", width: "100%", margin: 0, padding: 0 }}
    >
      <motion.div style={profileCardStyle}>
        <h1 className="text-center mb-4" style={{ color: textColor }}>Twój profil</h1>
        {message && <div className="text-center" style={alertStyle}>{message}</div>}

        {loading ? (
          <div className="text-center">
            <div className="spinner-border" style={{ color: textColor }} role="status">
              <span className="visually-hidden">Ładowanie...</span>
            </div>
          </div>
        ) : carListings.length === 0 ? (
          <p className="text-center" style={{ color: textColor }}>Nie masz jeszcze żadnych samochodów.</p>
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
                  <th style={tableCellStyle}>Akcje</th>
                </tr>
              </thead>
              <tbody>
                {carListings.map((car) => (
                  <tr key={car.id}>
                    <td style={tableCellStyle}>{car.brand}</td>
                    <td style={tableCellStyle}>{car.engineCapacity.toFixed(1)}</td>
                    <td style={tableCellStyle}>{car.fuelType}</td>
                    <td style={tableCellStyle}>{car.seats}</td>
                    <td style={tableCellStyle}>{car.carType}</td>
                    <td style={tableCellStyle}>{car.features.join(", ") || "Brak"}</td>
                    <td style={tableCellStyle}>
                      Lat: {car.latitude.toFixed(4)}, Lng: {car.longitude.toFixed(4)}
                    </td>
                    <td style={tableCellStyle}>
                      <motion.button
                        style={deleteButtonStyle}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDelete(car.id)}
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
      </motion.div>
    </motion.div>
  );
};

export default ProfilePage;