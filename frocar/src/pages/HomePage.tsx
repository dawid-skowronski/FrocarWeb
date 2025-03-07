import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaPlusCircle, FaCar } from "react-icons/fa";

const HomePage = () => {
    return (
        
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="container flex-grow-1 d-flex flex-column justify-content-center align-items-center"
            >
                <div className="row w-75 g-4">
                    {/* Dodaj samochód */}
                    <div className="col-md-6 d-flex justify-content-center">
                        <Link to="/add-car" className="text-decoration-none w-100">
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="p-4 rounded-4 text-center shadow-lg"
                                style={{
                                    backgroundColor: "rgba(248, 249, 250, 0.8)",
                                    border: "2px solid #0c7b3e",
                                    cursor: "pointer",
                                    transition: "all 0.3s ease",
                                    color: "#0c7b3e"
                                }}
                            >
                                <FaPlusCircle size="3em" style={{ color: "#0c7b3e" }} />
                                <h4 className="mt-3">Dodaj samochód</h4>
                            </motion.div>
                        </Link>
                    </div>

                    {/* Wypożycz samochód */}
                    <div className="col-md-6 d-flex justify-content-center">
                        <Link to="/rent-car" className="text-decoration-none w-100">
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="p-4 rounded-4 text-center shadow-lg"
                                style={{
                                    backgroundColor: "rgba(248, 249, 250, 0.8)",
                                    border: "2px solid #0c7b3e",
                                    cursor: "pointer",
                                    transition: "all 0.3s ease",
                                    color: "#0c7b3e"
                                }}
                            >
                                <FaCar size="3em" style={{ color: "#0c7b3e" }} />
                                <h4 className="mt-3">Wypożycz samochód</h4>
                            </motion.div>
                        </Link>
                    </div>
                </div>
            </motion.div>
        
    );
};

export default HomePage;