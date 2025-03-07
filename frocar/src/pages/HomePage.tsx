import { motion, MotionStyle } from "framer-motion";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaPlusCircle, FaCar } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";

// Definicja wariantów dla animacji i hover
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  hover: { scale: 1.05 },
};

const HomePage = () => {
  const { theme } = useTheme();

  // Dynamiczne style w zależności od motywu
  const backgroundColor = theme === "dark" ? "#121212" : "#f8f9fa";
  const cardBackgroundColor = theme === "dark" ? "#333" : "rgba(248, 249, 250, 0.8)";
  const cardHoverBackgroundColor = theme === "dark" ? "#444" : "rgba(240, 240, 240, 0.9)";
  const textColor = theme === "dark" ? "#e0e0e0" : "#0c7b3e";
  const borderColor = theme === "dark" ? "#ffffff" : "#0c7b3e"; // Biała ramka w trybie ciemnym

  // Styl dla kart
  const cardStyle: MotionStyle = {
    border: `1px solid ${borderColor}`,
    cursor: "pointer",
    color: textColor,
    width: "700px",
    height: "200px",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "20px",
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
    textAlign: "center",
    backgroundColor: cardBackgroundColor,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="container-fluid d-flex justify-content-center align-items-center min-vh-100"
      style={{ fontFamily: "'Roboto', sans-serif", backgroundColor }}
    >
      <div className="row g-4">
        {/* Dodaj samochód */}
        <div className="col-12 col-md-6 d-flex justify-content-center">
          <Link to="/add-car" className="text-decoration-none">
            <motion.div
              variants={{
                ...cardVariants,
                visible: { ...cardVariants.visible, backgroundColor: cardBackgroundColor },
                hover: { ...cardVariants.hover, backgroundColor: cardHoverBackgroundColor },
              }}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              transition={{ duration: 0.5, delay: 0.2 }}
              style={cardStyle}
            >
              <FaPlusCircle size="4em" style={{ color: textColor }} />
              <h4 className="mt-3" style={{ color: textColor }}>
                Dodaj samochód
              </h4>
            </motion.div>
          </Link>
        </div>

        {/* Wypożycz samochód */}
        <div className="col-12 col-md-6 d-flex justify-content-center">
          <Link to="/rent-car" className="text-decoration-none">
            <motion.div
              variants={{
                ...cardVariants,
                visible: { ...cardVariants.visible, backgroundColor: cardBackgroundColor },
                hover: { ...cardVariants.hover, backgroundColor: cardHoverBackgroundColor },
              }}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              transition={{ duration: 0.5, delay: 0.4 }}
              style={cardStyle}
            >
              <FaCar size="4em" style={{ color: textColor }} />
              <h4 className="mt-3" style={{ color: textColor }}>
                Wypożycz samochód
              </h4>
            </motion.div>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default HomePage;