import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaPlusCircle, FaCar } from "react-icons/fa";
import { useThemeStyles } from "../styles/useThemeStyles";

interface HomeCardLinkProps {
  to: string;
  icon: React.ElementType;
  text: string;
  delay: number;
  onClick: () => void;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  hover: { scale: 1.05 },
};

const HomeCardLink: React.FC<HomeCardLinkProps> = ({ to, icon: Icon, text, delay, onClick }) => {
  const {
    cardBackgroundColor,
    cardHoverBackgroundColor,
    textColor,
    cardStyle,
  } = useThemeStyles();

  return (
    <Link
      to={to}
      className="text-decoration-none"
      onClick={onClick}
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
        transition={{ duration: 0.5, delay }}
        style={{ ...cardStyle, height: "150px" }}
      >
        <Icon size="3em" style={{ color: textColor }} />
        <h4 className="mt-2" style={{ color: textColor, fontSize: "1.2rem" }}>
          {text}
        </h4>
      </motion.div>
    </Link>
  );
};

interface HomePageProps {
  setLoading: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ setLoading }) => {
  const { backgroundColor } = useThemeStyles();

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
          <HomeCardLink
            to="/add-car"
            icon={FaPlusCircle}
            text="Dodaj samochód"
            delay={0.2}
            onClick={handleClick}
          />
        </div>

        <div className="col-12 col-md-6 d-flex justify-content-center">
          <HomeCardLink
            to="/rent-car"
            icon={FaCar}
            text="Wypożycz samochód"
            delay={0.4}
            onClick={handleClick}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default HomePage;
