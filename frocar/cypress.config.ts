const { defineConfig } = require("cypress");

module.exports = defineConfig({
  projectId: 'k5rf1d',
  e2e: {
    baseUrl: "http://localhost:5173",
    setupNodeEvents(on, config) {
   
    },
    viewportWidth: 1920, 
    viewportHeight: 1080, 
  },
  env: {
    apiUrl: "https://localhost:5001/api", 
  },
});