const { defineConfig } = require("cypress");

module.exports = defineConfig({
  projectId: 'k5rf1d',
  e2e: {
    baseUrl: "http://localhost:5173",
    setupNodeEvents(on, config) {
      // Mockowanie żądań Google Maps API, jeśli potrzebne
      on('task', {
        // Możesz dodać zadania do mockowania lub innych operacji
        log(message) {
          console.log(message);
          return null;
        },
      });
    },
    viewportWidth: 1920,
    viewportHeight: 1080,
    specPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx}', // Wsparcie dla .ts i .tsx
  },
  env: {
    apiUrl: "https://localhost:5001/api",
    VITE_GOOGLE_MAPS_API_KEY: "fake-api-key", // Klucz do mockowania Google Maps
  },
  // Opcjonalnie: zwiększ timeouty dla wolniejszych API
  defaultCommandTimeout: 10000,
  requestTimeout: 15000,
  responseTimeout: 30000,
});