import { useState, useEffect } from "react";

import { motion } from "framer-motion";

// Interfejs dla modelu CarListing (na podstawie modelu z backendu)
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
  // State do przechowywania listy samochodów
  const [carListings, setCarListings] = useState<CarListing[]>([]);
  // State do komunikatów o błędach lub sukcesie
  const [message, setMessage] = useState<string>("");
  // State do ładowania
  const [loading, setLoading] = useState<boolean>(true);

  // Pobieranie listy samochodów przy załadowaniu komponentu
  useEffect(() => {
    fetchUserCarListings();
  }, []);

  const fetchUserCarListings = async () => {
    setLoading(true);
    setMessage("");

    // Pobierz token z sessionStorage lub localStorage
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

  // Usuwanie samochodu
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

      // Odśwież listę po usunięciu
      setCarListings(carListings.filter((car) => car.id !== id));
      setMessage("Samochód został usunięty pomyślnie.");
    } catch (error) {
      const err = error as Error;
      setMessage(`Błąd: ${err.message}`);
    }
  };

  return (
    
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mt-5"
      >
        <h1 className="text-center mb-4">Twój profil</h1>
        {message && <div className="alert alert-info text-center">{message}</div>}

        {loading ? (
          <div className="text-center">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Ładowanie...</span>
            </div>
          </div>
        ) : carListings.length === 0 ? (
          <p className="text-center">Nie masz jeszcze żadnych samochodów.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped table-bordered">
              <thead className="table-dark">
                <tr>
                  <th>Marka</th>
                  <th>Pojemność silnika (l)</th>
                  <th>Rodzaj paliwa</th>
                  <th>Liczba miejsc</th>
                  <th>Typ samochodu</th>
                  <th>Dodatki</th>
                  <th>Lokalizacja</th>
                  <th>Akcje</th>
                </tr>
              </thead>
              <tbody>
                {carListings.map((car) => (
                  <tr key={car.id}>
                    <td>{car.brand}</td>
                    <td>{car.engineCapacity.toFixed(1)}</td>
                    <td>{car.fuelType}</td>
                    <td>{car.seats}</td>
                    <td>{car.carType}</td>
                    <td>{car.features.join(", ") || "Brak"}</td>
                    <td>
                      Lat: {car.latitude.toFixed(4)}, Lng: {car.longitude.toFixed(4)}
                    </td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(car.id)}
                      >
                        Usuń
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    
  );
};

export default ProfilePage;