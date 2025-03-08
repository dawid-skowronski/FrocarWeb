import { useTheme } from "../context/ThemeContext";
import { CSSProperties } from "react";

export const useThemeStyles = () => {
  const { theme } = useTheme();

  const backgroundColor = theme === "dark" ? "#1a1a1a" : "#f8f9fa";
  const cardBackgroundColor = theme === "dark" ? "#2d2d2d" : "#ffffff";
  const cardHoverBackgroundColor = theme === "dark" ? "#444" : "rgba(240, 240, 240, 0.9)";
  const textColor = theme === "dark" ? "#ffffff" : "#218838"; // Zmiana na #218838 w trybie jasnym
  const borderColor = theme === "dark" ? "#444" : "#e0e0e0";
  const inputBackgroundColor = theme === "dark" ? "#3d3d3d" : "#f1f1f1";
  const buttonColor = theme === "dark" ? "btn-outline-light" : "btn-success";
  const errorColor = theme === "dark" ? "alert-dark" : "alert-danger";
  const switchColor = theme === "dark" ? "#666" : "#ced4da";
  const buttonBackgroundColor = theme === "dark" ? "#555555" : undefined;
  const buttonBorderColor = theme === "dark" ? "#666666" : undefined;

  const cardStyle: CSSProperties = {
    border: `1px solid ${borderColor}`,
    color: textColor,
    width: "600px",
    maxWidth: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "12px",
    boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
    textAlign: "center",
    backgroundColor: cardBackgroundColor,
    padding: "20px",
  };

  const profileCardStyle: CSSProperties = {
    border: `1px solid ${borderColor}`,
    color: textColor,
    width: "90%",
    maxWidth: "1200px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "12px",
    boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
    textAlign: "center",
    backgroundColor: cardBackgroundColor,
    padding: "20px",
    margin: "0 auto",
  };

  const tableStyle: CSSProperties = {
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
    borderCollapse: "separate",
    backgroundColor: cardBackgroundColor,
    width: "100%",
  };

  const tableHeaderStyle: CSSProperties = {
    color: "#ffffff",
    backgroundColor: theme === "dark" ? "#3a3a3a" : "#28a745",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  };

  const tableCellStyle: CSSProperties = {
    borderColor: theme === "dark" ? "#444" : "#e0e0e0",
    backgroundColor: theme === "dark" ? "#2d2d2d" : "#ffffff",
    padding: "12px 16px",
    borderBottom: `1px solid ${borderColor}`,
    textAlign: "left",
    fontSize: "14px",
    color: textColor, // Upewniamy się, że komórki też używają textColor
  };

  const deleteButtonStyle: CSSProperties = {
    backgroundColor: theme === "dark" ? "#bf2e3c" : "#bf2e3c",
    border: "none",
    color: "white",
    padding: "8px 20px",
    borderRadius: "20px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
  };

  const alertStyle: CSSProperties = {
    backgroundColor: theme === "dark" ? "#444" : "#d1e7dd",
    borderRadius: "10px",
    boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.1)",
    color: textColor,
    padding: "10px",
    marginBottom: "15px",
  };

  return {
    theme,
    backgroundColor,
    cardBackgroundColor,
    cardHoverBackgroundColor,
    textColor,
    borderColor,
    inputBackgroundColor,
    buttonColor,
    errorColor,
    switchColor,
    buttonBackgroundColor,
    buttonBorderColor,
    cardStyle,
    profileCardStyle,
    tableStyle,
    tableHeaderStyle,
    tableCellStyle,
    deleteButtonStyle,
    alertStyle,
  };
};