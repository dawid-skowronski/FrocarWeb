const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: "http://localhost:5173", // lub inny port gdzie działa twój frontend
    setupNodeEvents(on, config) {
      // implementacja eventów node
    },
  },
  env: {
    apiUrl: "https://localhost:5001/api", // adres twojego backendu
  },
});