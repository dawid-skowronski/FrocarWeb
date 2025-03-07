import { motion } from "framer-motion";
import { ReactNode, useEffect } from "react";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  useEffect(() => {
    // Dynamiczne zarządzanie przewijaniem z uwzględnieniem Navbar
    const handleScroll = () => {
      const navbar = document.querySelector(".navbar") as HTMLElement | null;
      const layout = document.querySelector(".layout-container") as HTMLElement | null;
      if (navbar && layout) {
        const navbarHeight = navbar.offsetHeight; // Rzeczywista wysokość Navbar
        layout.style.minHeight = `calc(100vh - ${navbarHeight}px)`; // Dynamicznie ustawiamy minHeight
        const layoutHeight = layout.scrollHeight;
        const viewportHeight = window.innerHeight - navbarHeight;
        if (layoutHeight <= viewportHeight) {
          document.body.style.overflowY = "hidden";
        } else {
          document.body.style.overflowY = "auto";
        }
      }
    };

    handleScroll(); // Wywołanie przy załadowaniu
    window.addEventListener("resize", handleScroll);
    window.addEventListener("load", handleScroll);
    return () => {
      window.removeEventListener("resize", handleScroll);
      window.removeEventListener("load", handleScroll);
    };
  }, []);

  return (
    <motion.div
      className="d-flex flex-column layout-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      style={{
        background: "linear-gradient(120deg, #ffffff, #e6f5e6, #ffffff)",
        backgroundSize: "150% 150%",
        animation: "gradientAnimation 10s ease infinite",
        color: "#333",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <style>
        {`
          @keyframes gradientAnimation {
            0% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
            100% {
              background-position: 0% 50%;
            }
          }
          .layout-container {
            position: relative;
            display: flex;
            flex-direction: column;
          }
        `}
      </style>
      {children}
    </motion.div>
  );
};

export default Layout;