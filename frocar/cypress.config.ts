const { defineConfig } = require("cypress");

module.exports = defineConfig({
  projectId: 'k5rf1d',
  e2e: {
    baseUrl: "http://localhost:5173", // lub inny port gdzie działa twój frontend
    setupNodeEvents(on, config) {
      // implementacja eventów node
    },
    viewportWidth: 1920, // szerokość okna przeglądarki
    viewportHeight: 1080, // wysokość okna przeglądarki
  },
  env: {
    apiUrl: "https://localhost:5001/api", // adres twojego backendu
  },
});