import React, { useState, useEffect } from "react";
import {
    GoogleMap,
    LoadScript,
    Marker,
} from "@react-google-maps/api";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const containerStyle = {
    width: "100%",
    height: "500px",
};

const defaultCenter = {
    lat: 51.5074, // Domyślne centrum (np. Londyn)
    lng: -0.1278,
};

interface MapPoint {
    id: number;
    latitude: number;
    longitude: number;
    userId: number;
}

const Map: React.FC = () => {
    const { isAuthenticated, logout } = useAuth();
    const [mapPoints, setMapPoints] = useState<MapPoint[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    // Pobieranie tokenu z magazynu, jeśli użytkownik jest uwierzytelniony
    const getToken = () => {
        return isAuthenticated ? localStorage.getItem("token") || sessionStorage.getItem("token") : null;
    };

    // Pobieranie punktów przy załadowaniu
    useEffect(() => {
        if (isAuthenticated) {
            const token = getToken();
            if (token) {
                fetchMapPoints(token);
            }
        }
    }, [isAuthenticated]);

    const fetchMapPoints = async (token: string) => {
        setLoading(true);
        try {
            const response = await axios.get("https://localhost:5001/api/MapPoints", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setMapPoints(response.data);
        } catch (err) {
            setError("Błąd podczas pobierania punktów: " + (err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const handleMapClick = async (event: google.maps.MapMouseEvent) => {
        if (!isAuthenticated) {
            setError("Musisz być zalogowany, aby dodać punkt.");
            return;
        }

        const token = getToken();
        if (!token) {
            setError("Błąd autoryzacji. Proszę zaloguj się ponownie.");
            return;
        }

        const newPoint = {
            latitude: event.latLng?.lat() || 0,
            longitude: event.latLng?.lng() || 0,
        };

        setLoading(true);
        try {
            const response = await axios.post("https://localhost:5001/api/MapPoints", newPoint, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });
            setMapPoints([...mapPoints, response.data]);
            setError(null);
        } catch (err) {
            setError("Błąd podczas dodawania punktu: " + (err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const onLoad = (mapInstance: google.maps.Map) => {
        // Opcjonalna logika po załadowaniu mapy
    };

    // Pobieranie klucza API z import.meta.env
    const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!googleMapsApiKey) {
        return <p className="text-danger text-center mt-3">Brak klucza API Google Maps. Sprawdź plik .env.</p>;
    }

    // Jeśli użytkownik nie jest zalogowany, nie renderuj nic
    if (!isAuthenticated) {
        return null; // Nic nie renderujemy
    }

    return (
        <>
            <LoadScript googleMapsApiKey={googleMapsApiKey}>
                <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={defaultCenter}
                    zoom={10}
                    onClick={handleMapClick}
                    onLoad={onLoad}
                >
                    {mapPoints.map((point) => (
                        <Marker
                            key={point.id}
                            position={{ lat: point.latitude, lng: point.longitude }}
                            title={`Lat: ${point.latitude}, Lng: ${point.longitude}`}
                        />
                    ))}
                </GoogleMap>
            </LoadScript>
            {loading && (
                <div className="text-center mt-3">
                    <div className="spinner-border text-success" role="status">
                        <span className="visually-hidden">Ładowanie...</span>
                    </div>
                </div>
            )}
            {error && <p className="text-danger text-center mt-3">{error}</p>}
        </>
    );
};

export default Map;