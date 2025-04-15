import React from "react";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext"; 

const FullscreenText: React.FC = () => {
  const { theme } = useTheme(); 

  const backgroundColor = theme === "dark" ? "#1a1a1a" : "#f8f9fa";
  const textColor = theme === "dark" ? "#ffffff" : "#218838";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: backgroundColor, 
        zIndex: 1000,
        fontSize: "3rem", 
        fontWeight: "bold",
        color: textColor, 
        fontFamily: "'Roboto', sans-serif", 
      }}
    >
      FroCar
    </motion.div>
  );
};

export default FullscreenText;
