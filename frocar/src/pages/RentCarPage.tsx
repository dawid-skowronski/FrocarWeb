import { motion } from "framer-motion";
import Map from "../components/Map";
import { useThemeStyles } from "../styles/useThemeStyles";

const RentCarPage = () => {
  const { backgroundColor, textColor } = useThemeStyles();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container my-5"
      style={{ backgroundColor, color: textColor }}
    >
      <h1 className="text-center mb-4" style={{ color: textColor }}>Wypożycz samochód</h1>
      <div className="mb-5">
        <h3 className="text-center mb-3" style={{ color: textColor }}>Wybierz lokalizację na mapie</h3>
        <Map />
      </div>
      <div className="text-center">
        <p>
          Tutaj będzie lista dostępnych samochodów lub formularz do wypożyczenia. Wybierz punkt na mapie, aby zobaczyć dostępne opcje.
        </p>
      </div>
    </motion.div>
  );
};

export default RentCarPage;