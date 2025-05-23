import React, { useState, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import HomePage from "./pages/HomePage";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import Navbar from "./components/Navbar";
import { AuthProvider, useAuth } from "./context/AuthContext";
import "bootstrap/dist/css/bootstrap.min.css";
import { ThemeProvider } from "./context/ThemeContext";
import "./styles.css";
import AddCarPage from "./pages/AddCarPage";
import RentCarPage from "./pages/RentCarPage";
import ProfilePage from "./pages/Profile";
import FullscreenText from "./components/FullscreenText";
import RentalsPage from "./pages/RentalsPage";
import RentalDetailsPage from "./pages/RentalDetailsPage";
import RentalHistoryPage from "./pages/RentalHistoryPage";
import Cookies from 'js-cookie';
import markNotificationAsRead from './services/markNotificationAsRead';
import RequestPasswordResetPage from "./pages/RequestPasswordResetPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

interface Notification {
  message: string;
  notificationId: number;
}

const AppContent: React.FC = () => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { isAuthenticated } = useAuth();

  const setLoading = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchNotifications = async () => {
      try {
        const token = Cookies.get('token'); 
        const response = await fetch('https://localhost:5001/api/Account/Notification', {
          headers: {
            'Authorization': `Bearer ${token}` 
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch notifications');
        }

        const data = await response.json();

        if (data.message === "Brak nowych powiadomień.") {
          toast.info(data.message);
        } else {
          await Promise.all(data.map((notification: Notification) =>
            markNotificationAsRead(notification.notificationId)
          ));

          data.forEach((notification: Notification) => {
            toast.success(`Nowe powiadomienie: ${notification.message}`);
          });
        }
      } catch (error) {
        toast.error('Wystąpił błąd podczas pobierania powiadomień.');
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); 

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return (
    <>
      <Navbar setLoading={setLoading} />
      <AnimatePresence mode="wait">
        {isLoading && <FullscreenText />}
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
