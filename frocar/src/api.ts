const API_URL = "https://localhost:5001"; // Twój backend

export const fetchUsers = async () => {
    try {
        const token = localStorage.getItem("token"); // Pobierz token JWT z localStorage
        if (!token) throw new Error("Brak tokena autoryzacji");

        const response = await fetch(`${API_URL}/api/Account`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` // Dodaj token do nagłówka
            },
        });

        if (!response.ok) throw new Error("Błąd pobierania danych");
        return await response.json();
    } catch (error) {
        console.error("Błąd:", error);
        return [];
    }
};
