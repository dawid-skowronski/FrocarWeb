import { motion } from "framer-motion";
import Layout from "../components/Layout";

const AddCarPage = () => {
  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mt-5"
      >
        <h1 className="text-center">Dodaj samochód</h1>
        <p className="text-center">
          Tutaj będzie formularz do dodawania nowego samochodu. Na razie to placeholder.
        </p>
        {/* Dodaj tutaj formularz w przyszłości */}
      </motion.div>
    </Layout>
  );
};

export default AddCarPage;