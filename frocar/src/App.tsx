import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import Navbar from "./components/Navbar";
import { AuthProvider } from "./context/AuthContext"; // Import kontekstu
import "bootstrap/dist/css/bootstrap.min.css";
import { ThemeProvider } from "./context/ThemeContext";
import "./styles.css";
import AddCarPage from "./pages/AddCarPage";
import RentCarPage from "./pages/RentCarPage";
import ProfilePage from "./pages/Profile";
function App() {
    return (
        <AuthProvider> {/* Musi otaczać całą aplikację */}
            <ThemeProvider>
            <Navbar />
           
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/add-car" element={<AddCarPage />} />
                <Route path="/rent-car" element={<RentCarPage />} />
                <Route path="/profile" element={<ProfilePage />} />
            </Routes>
            </ThemeProvider>
        </AuthProvider>
    );
}

export default App;
