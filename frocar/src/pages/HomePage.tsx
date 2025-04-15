import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaPlusCircle, FaCar } from "react-icons/fa";
import { useThemeStyles } from "../styles/useThemeStyles";

interface HomePageProps {
  setLoading: () => void;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  hover: { scale: 1.05 },
};

const HomePage: React.FC<HomePageProps> = ({ setLoading }) => {
  const {
    backgroundColor,
    cardBackgroundColor,
    cardHoverBackgroundColor,
    textColor,
    cardStyle,
  } = useThemeStyles();

  const handleClick = () => {
    setLoading();
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
        <div className="col-12 col-md-6 d-flex justify-content-center">
          <Link
            to="/add-car"
            className="text-decoration-none"
            onClick={handleClick}
          >
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
              style={{ ...cardStyle, height: "150px" }}
            >
              <FaPlusCircle size="3em" style={{ color: textColor }} />
              <h4 className="mt-2" style={{ color: textColor, fontSize: "1.2rem" }}>
                Dodaj samochód
              </h4>
            </motion.div>
          </Link>
        </div>

        <div className="col-12 col-md-6 d-flex justify-content-center">
          <Link
            to="/rent-car"
            className="text-decoration-none"
            onClick={handleClick}
          >
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
              style={{ ...cardStyle, height: "150px" }}
            >
              <FaCar size="3em" style={{ color: textColor }} />
              <h4 className="mt-2" style={{ color: textColor, fontSize: "1.2rem" }}>
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
