import { motion } from "framer-motion";

import Map from "../components/Map"; // Importujemy komponent Map

const RentCarPage = () => {
  return (
   
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container my-5"
      >
        <h1 className="text-center mb-4">Wypożycz samochód</h1>

        {/* Sekcja z mapą */}
        <div className="mb-5">
          <h3 className="text-center mb-3">Wybierz lokalizację na mapie</h3>
          <Map />
        </div>

        {/* Placeholder na listę samochodów lub formularz */}
        <div className="text-center">
          <p>
            Tutaj będzie lista dostępnych samochodów lub formularz do wypożyczenia. Wybierz punkt na mapie, aby zobaczyć dostępne opcje.
          </p>
        </div>
      </motion.div>
   
  );
};

export default RentCarPage;