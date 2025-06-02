import React, { useState, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Importy komponentów stron
import HomePage from "./pages/HomePage";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import AddCarPage from "./pages/AddCarPage";
import RentCarPage from "./pages/RentCarPage";
import ProfilePage from "./pages/Profile";
import RentalsPage from "./pages/RentalsPage";
import RentalDetailsPage from "./pages/RentalDetailsPage";
import RentalHistoryPage from "./pages/RentalHistoryPage";
import RequestPasswordResetPage from "./pages/RequestPasswordResetPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

// Importy komponentów i kontekstów
import Navbar from "./components/Navbar";
import FullscreenText from "./components/FullscreenText";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

// Import Bootstrap CSS
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles.css"; // Twój globalny plik stylów

// Importujemy nasz NotificationService
import { notificationService } from './services/NotificationService';

// Interfejs dla powiadomienia (może być również w NotificationService.ts)
interface Notification {
  message: string;
  notificationId: number;
}

const AppContent: React.FC = () => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { isAuthenticated } = useAuth();

  // Funkcja do ustawiania stanu ładowania, używana przez Navbar
  const setLoading = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000); // Czas trwania animacji ładowania
  };

  // Efekt do zarządzania subskrypcją powiadomień
  useEffect(() => {
    // Callback, który będzie wywoływany przez NotificationService
    // po otrzymaniu nowych powiadomień.
    const handleNewNotifications = (notifications: Notification[]) => {
      notifications.forEach((notification: Notification) => {
        toast.success(`Nowe powiadomienie: ${notification.message}`);
      });
      // Jeśli NotificationService.ts ma też toast.info dla "Brak nowych powiadomień",
      // możesz usunąć toasty stąd, aby uniknąć duplikacji.
      // W obecnej konfiguracji NotificationService.ts, toasty są już tam obsługiwane.
    };

    // Jeśli użytkownik jest zalogowany, subskrybujemy do serwisu powiadomień
    if (isAuthenticated) {
      notificationService.subscribe(handleNewNotifications);
      // Rozpoczynamy polling powiadomień
      notificationService.startPolling(10000); // Polling co 10 sekund

      // Funkcja czyszcząca: ważne, aby anulować subskrypcję i zatrzymać polling
      // przy odmontowaniu komponentu lub zmianie stanu autoryzacji
      return () => {
        notificationService.unsubscribe(handleNewNotifications);
        notificationService.stopPolling();
      };
    } else {
      // Jeśli użytkownik nie jest zalogowany, upewnij się, że polling jest zatrzymany
      notificationService.stopPolling();
    }
  }, [isAuthenticated]); // Efekt uruchamia się ponownie, gdy zmienia się stan autoryzacji

  return (
    <>
      <Navbar setLoading={setLoading} />
      {/* AnimatePresence do animacji przejść między stronami */}
      <AnimatePresence mode="wait">
        {/* Komponent FullscreenText wyświetlany podczas ładowania */}
        {isLoading && <FullscreenText />}
        {/* Wyświetlaj trasy tylko wtedy, gdy nie ma ładowania */}
        {!isLoading && (
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<HomePage setLoading={setLoading} />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/add-car" element={<AddCarPage />} />
            <Route path="/rent-car" element={<RentCarPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/rentals" element={<RentalsPage />} />
            <Route path="/rentals/:id" element={<RentalDetailsPage />} />
            <Route path="/rental-history" element={<RentalHistoryPage />} />
            <Route path="/request-password-reset" element={<RequestPasswordResetPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Routes>
        )}
      </AnimatePresence>
      {/* Kontener dla toastów (powiadomień) */}
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </>
  );
};

// Główny komponent aplikacji, który dostarcza konteksty (Auth i Theme)
const App: React.FC = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;