import React, { useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import HomePage from "./pages/HomePage";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import Navbar from "./components/Navbar";
import { AuthProvider } from "./context/AuthContext"; 
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

const App = () => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const setLoading = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000); 
  };

  return (
    <AuthProvider> 
      <ThemeProvider>
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
            </Routes>
          )}
        </AnimatePresence>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;