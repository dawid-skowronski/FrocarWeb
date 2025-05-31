describe('RentCarPage', () => {
  // Obsługa nieoczekiwanych wyjątków
  Cypress.on('uncaught:exception', (err, runnable) => {
    console.error('Nieoczekiwany wyjątek:', err.message);
    return false;
  });

  // Funkcja pomocnicza do logowania
  const loginUser = () => {
    // Przechwytujemy żądanie logowania
    cy.intercept('POST', 'https://localhost:5001/api/Account/login', {
      statusCode: 200,
      body: {
        token: 'fakeToken',
      },
    }).as('loginRequest');

    // Wykonujemy żądanie logowania
    cy.request({
      method: 'POST',
      url: 'https://localhost:5001/api/Account/login',
      body: {
        username: 'Kozub',
        password: 'Qwerty123!',
      },
      failOnStatusCode: false,
    }).then((response) => {
      if (response.status === 200) {
        // Ustawiamy token w ciasteczkach
        cy.setCookie('token', response.body.token);
        cy.setCookie('jwt', response.body.token);
      }
    });
  };

  // Funkcja pomocnicza do ustawiania mocków API
  const setupMocks = () => {
    // Mock geokodowania
    cy.intercept('GET', 'https://maps.googleapis.com/maps/api/geocode/json?address=*', {
      statusCode: 200,
      body: {
        status: 'OK',
        results: [
          {
            geometry: {
              location: {
                lat: 51.4011,
                lng: 16.2015,
              },
            },
            formatted_address: 'Orla 70, 59-300 Lubin, Poland',
          },
        ],
      },
    }).as('geocodeCity');

    // Mock listy samochodów
    cy.intercept('GET', 'https://localhost:5001/api/CarListings/list?lat=*&lng=*&radius=50', {
      statusCode: 200,
      body: [
        {
          id: 1,
          brand: 'Toyota',
          engineCapacity: 2.0,
          fuelType: 'benzyna',
          seats: 5,
          carType: 'sedan',
          rentalPricePerDay: 100,
          isAvailable: true,
          userId: 456,
          features: ['Klimatyzacja', 'GPS'],
          latitude: 51.4011,
          longitude: 16.2015,
          isApproved: true,
          averageRating: 4.5,
        },
      ],
    }).as('getCarListings');

    // Mock recenzji
    cy.intercept('GET', 'https://localhost:5001/api/CarRental/reviews/1', {
      statusCode: 200,
      body: [
        {
          reviewId: 1,
          carRentalId: 1,
          userId: 123,
          rating: 5,
          comment: 'Świetny samochód!',
          user: { id: 123, userName: 'Kozub' },
        },
      ],
    }).as('getReviews');

    // Mock wynajmu samochodu
    cy.intercept('POST', 'https://localhost:5001/api/CarRental/create', {
      statusCode: 200,
      body: { message: 'Wypożyczenie utworzone pomyślnie!' },
    }).as('rentCar');
  };

  beforeEach(() => {
    loginUser();
    setupMocks();
    cy.visit('/rent-car');
    cy.wait(1000);
  });

  it('powinno poprawnie renderować stronę wynajmu samochodu dla zalogowanego użytkownika', () => {
    cy.get('h1').should('have.text', 'Wynajmij samochód');
    cy.get('input[placeholder="Wpisz miasto (np. Warszawa)"]').should('be.visible');
    cy.get('button').contains('Szukaj').should('be.visible');
  });

  it('powinno wyszukiwać samochody po mieście i wyświetlać ogłoszenia', () => {
    cy.get('input[placeholder="Wpisz miasto (np. Warszawa)"]').type('Lubin');
    cy.get('button').contains('Szukaj').click();
    cy.wait('@geocodeCity');
    cy.wait('@getCarListings');
    cy.get('.card').should('have.length', 1);
    cy.get('.card').first().within(() => {
      cy.contains('Toyota').should('be.visible');
      cy.contains('sedan').should('be.visible');
    });
  });

  it('powinno filtrować samochody po marce, typie paliwa, cenie i liczbie miejsc', () => {
    cy.get('input[placeholder="Wpisz miasto (np. Warszawa)"]').type('Lubin');
    cy.get('button').contains('Szukaj').click();
    cy.wait('@geocodeCity');
    cy.wait('@getCarListings');

    // Filtruj po marce
    cy.get('input[placeholder="Wpisz markę"]').type('Toyota');
    cy.get('.card').should('have.length', 1);
    cy.get('.card').contains('Toyota').should('be.visible');
    cy.get('input[placeholder="Wpisz markę"]').clear();

    // Filtruj po typie paliwa
    cy.get('select').select('benzyna');
    cy.get('.card').should('have.length', 1);
    cy.get('.card').contains('benzyna').should('be.visible');
    cy.get('select').select('all');

    // Filtruj po cenie
    cy.get('input[placeholder="Min"]').first().type('90');
    cy.get('.card').should('have.length', 1);
    cy.get('input[placeholder="Min"]').first().clear();
    cy.get('input[placeholder="Max"]').type('90');
    cy.get('.card').should('have.length', 0);
    cy.get('input[placeholder="Max"]').clear();

    // Filtruj po liczbie miejsc
    cy.get('input[placeholder="Min"]').last().type('5');
    cy.get('.card').should('have.length', 1);
    cy.get('input[placeholder="Min"]').last().clear();
  });

  it('powinno wynająć samochód pomyślnie', () => {
    cy.get('input[placeholder="Wpisz miasto (np. Warszawa)"]').type('Lubin');
    cy.get('button').contains('Szukaj').click();
    cy.wait('@geocodeCity');
    cy.wait('@getCarListings');
    cy.get('.card').first().contains('Wynajmij').click();
    cy.get('.modal').should('be.visible');
    cy.get('input[type="date"]').first().type('2025-06-01');
    cy.get('input[type="date"]').last().type('2025-06-03');
    cy.get('.modal-footer').contains('Zakończ').click();
    cy.wait('@rentCar');
    cy.get('div.alert').should('contain', 'Wypożyczenie utworzone pomyślnie!');
  });

  it('powinno wyświetlać komunikat o błędzie przy nieprawidłowych datach wynajmu', () => {
    cy.get('input[placeholder="Wpisz miasto (np. Warszawa)"]').type('Lubin');
    cy.get('button').contains('Szukaj').click();
    cy.wait('@geocodeCity');
    cy.wait('@getCarListings');
    cy.get('.card').first().contains('Wynajmij').click();
    cy.get('.modal').should('be.visible');
    cy.get('input[type="date"]').first().type('2025-06-03');
    cy.get('input[type="date"]').last().type('2025-06-01');
    cy.get('.modal-footer').contains('Zakończ').click();
    cy.get('div.alert').should('contain', 'Data zakończenia musi być późniejsza.');
  });

  it('powinno wyświetlać mapę po kliknięciu na ogłoszenie', () => {
    cy.get('input[placeholder="Wpisz miasto (np. Warszawa)"]').type('Lubin');
    cy.get('button').contains('Szukaj').click();
    cy.wait('@geocodeCity');
    cy.wait('@getCarListings');
    cy.get('.card').first().click();
    cy.get('.modal').should('be.visible');
    cy.get('.modal-title').should('contain', 'Lokalizacja: Toyota');
    cy.get('.modal-body').contains('aleja Niepodległości 6a/46, 59-300 Lubin, Polska').should('be.visible');
  });

  it('powinno wyświetlać recenzje po kliknięciu "Pokaż recenzje"', () => {
    cy.get('input[placeholder="Wpisz miasto (np. Warszawa)"]').type('Lubin');
    cy.get('button').contains('Szukaj').click();
    cy.wait('@geocodeCity');
    cy.wait('@getCarListings');
    cy.get('.card').first().contains('Pokaż recenzje').click();
    cy.wait('@getReviews');
    cy.get('.modal').should('be.visible');
    cy.get('.modal-title').should('contain', 'Recenzje dla Toyota');
    cy.get('.modal-body').contains('Użytkownik: Kozub').should('be.visible');
  });
});
