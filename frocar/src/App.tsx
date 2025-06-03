import React, { useState, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
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
import Navbar from "./components/Navbar";
import FullscreenText from "./components/FullscreenText";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles.css"; 
import { notificationService } from './services/NotificationService';

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
    const handleNewNotifications = (notifications: Notification[]) => {
      notifications.forEach((notification: Notification) => {
        toast.success(`Nowe powiadomienie: ${notification.message}`);
      });
    };

    if (isAuthenticated) {
      notificationService.subscribe(handleNewNotifications);
      notificationService.startPolling(10000); 
      return () => {
        notificationService.unsubscribe(handleNewNotifications);
        notificationService.stopPolling();
      };
    } else {
      notificationService.stopPolling();
    }
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