describe('Strona profilu użytkownika', () => {
  const DEFAULT_TIMEOUT = 15000;
  Cypress.on('uncaught:exception', (err, runnable) => {
    console.error('Nieprzechwycony wyjątek:', err.message);
    return false;
  });

  const zalogujUzytkownika = () => {
    cy.intercept('POST', 'https://localhost:5001/api/Account/login', {
      statusCode: 200,
      body: { token: 'testowyToken' },
    }).as('loginRequest');

    cy.request({
      method: 'POST',
      url: 'https://localhost:5001/api/Account/login',
      body: { username: 'Kozub', password: 'Qwerty123!' },
      failOnStatusCode: false,
    }).then((response) => {
      if (response.status === 200) {
        cy.setCookie('token', response.body.token);
        cy.setCookie('jwt', response.body.token);
      }
    });
  };

  const ustawMocki = () => {
    cy.intercept('GET', 'https://maps.googleapis.com/maps/api/js?*', {
      statusCode: 200,
      body: {},
    }).as('googleMapsScript');

    cy.intercept('GET', 'https://maps.googleapis.com/maps/api/geocode/json?latlng=*', {
      statusCode: 200,
      body: {
        status: 'OK',
        results: [{ formatted_address: 'Orla 70, 59-300 Lubin, Poland' }],
      },
    }).as('reverseGeocoding');

    cy.intercept('GET', 'https://localhost:5001/api/CarListings/user', {
      statusCode: 200,
      body: [
        {
          id: 1,
          brand: 'Toyota',
          engineCapacity: 2.0,
          fuelType: 'benzyna',
          seats: 5,
          carType: 'sedan',
          features: ['Klimatyzacja', 'GPS'],
          latitude: 51.4011,
          longitude: 16.2015,
          userId: 123,
          rentalPricePerDay: 100,
          isAvailable: true,
          isApproved: true,
        },
        {
          id: 2,
          brand: 'Honda',
          engineCapacity: 1.5,
          fuelType: 'hybryda',
          seats: 5,
          carType: 'hatchback',
          features: ['Kamera cofania'],
          latitude: 51.4022,
          longitude: 16.2025,
          userId: 123,
          rentalPricePerDay: 80,
          isAvailable: false,
          isApproved: true,
        },
      ],
    }).as('getCarListings');
  };

  beforeEach(() => {
    zalogujUzytkownika();
    ustawMocki();
  });

  it('powinna przekierować na stronę logowania dla niezalogowanego użytkownika', () => {
    cy.clearCookie('token');
    cy.visit('/profile');
    cy.get('div.text-center', { timeout: DEFAULT_TIMEOUT }).should(
      'contain',
      'Sesja wygasła. Zaloguj się ponownie, aby zarządzać profilem.'
    );
    cy.url().should('include', '/login');
  });

  it('powinna poprawnie wyświetlić stronę profilu dla zalogowanego użytkownika', () => {
    cy.intercept('GET', 'https://localhost:5001/api/CarListings/user').as('getCarListings');
    cy.visit('/profile');
    
    cy.wait('@getCarListings').its('response.statusCode').should('eq', 200);
    cy.wait('@reverseGeocoding').its('response.statusCode').should('eq', 200);

    cy.get('h1').should('have.text', 'Twój profil');
    cy.contains('Nazwa użytkownika: Kozub').should('be.visible');
    
    cy.get('button').contains('Zmień nazwę użytkownika').should('be.visible');
    cy.get('button').contains('Zobacz historię wypożyczeń').should('be.visible');
    
    cy.get('input[placeholder="Wpisz markę"]').should('be.visible');
    cy.get('select').should('have.value', 'all');

    cy.get('table').should('be.visible');
    cy.get('tbody tr').should('have.length', 2);
    
    cy.get('tbody tr').first().within(() => {
      cy.contains('Toyota').should('be.visible');
      cy.contains('2.0').should('be.visible');
      cy.contains('benzyna').should('be.visible');
      cy.contains('5').should('be.visible');
      cy.contains('sedan').should('be.visible');
      cy.contains('Klimatyzacja, GPS').should('be.visible');
      cy.contains('Orla 70, 59-300 Lubin, Poland').should('be.visible');
      cy.contains('100').should('be.visible');
      cy.contains('Dostępny').should('be.visible');
      cy.get('button').contains('Edytuj').should('be.visible');
      cy.get('button').contains('Usuń').should('be.visible');
    });
  });

  it('powinna filtrować samochody po marce i dostępności', () => {
  cy.intercept('GET', 'https://localhost:5001/api/CarListings/user').as('getCarListings');
  cy.visit('/profile');
  cy.wait('@getCarListings');
  cy.wait('@reverseGeocoding');
  cy.get('[data-cy="listings-table"]').should('be.visible');

  cy.get('[data-cy="filter-brand-input"]').type('Toyota');
  cy.get('tbody tr').should('have.length', 1);
  cy.get('[data-cy="listing-row-1"]').contains('Toyota').should('be.visible');
  cy.get('tbody tr').contains('Honda').should('not.exist');

  cy.get('[data-cy="filter-brand-input"]').clear();
  cy.get('tbody tr').should('have.length', 2);

  cy.get('[data-cy="filter-availability-select"]').should('be.visible').select('available');
  cy.get('tbody tr').should('have.length', 1);
  cy.get('[data-cy="listing-row-1"]').contains('Toyota').should('be.visible');
  cy.get('tbody tr').contains('Honda').should('not.exist');

  cy.get('[data-cy="filter-availability-select"]').should('be.visible').select('unavailable');
  cy.get('tbody tr').should('have.length', 1);
  cy.get('[data-cy="listing-row-2"]').contains('Honda').should('be.visible');
  cy.get('tbody tr').contains('Toyota').should('not.exist');

  cy.get('[data-cy="filter-availability-select"]').should('be.visible').select('all');
  cy.get('tbody tr').should('have.length', 2);
});

  it('powinna zmienić nazwę użytkownika', () => {
    cy.intercept('PUT', 'https://localhost:5001/api/account/change-username', {
      statusCode: 200,
      body: { message: 'Nazwa użytkownika zmieniona pomyślnie!' },
    }).as('changeUsername');

    cy.intercept('GET', 'https://localhost:5001/api/CarListings/user').as('getCarListings');
    cy.visit('/profile');
    cy.wait('@getCarListings');

    cy.get('button').contains('Zmień nazwę użytkownika').click();
    cy.get('.modal').should('be.visible');
    cy.get('.modal-title').should('contain', 'Zmień nazwę użytkownika');
    
    cy.get('input[placeholder="Wpisz nową nazwę użytkownika"]').type('NowyTestUser');
    cy.get('.modal-footer').contains('Zapisz').click();
    
    cy.wait('@changeUsername').its('response.statusCode').should('eq', 200);
    cy.get('div.text-center').should('contain', 'Nazwa użytkownika zmieniona pomyślnie!');
    cy.get('.modal').should('not.exist');
  });

  it('powinna wyświetlać błędy dla nieprawidłowej nazwy użytkownika', () => {
    cy.intercept('GET', 'https://localhost:5001/api/CarListings/user').as('getCarListings');
    cy.visit('/profile');
    cy.wait('@getCarListings');
    cy.get('button').contains('Zmień nazwę użytkownika').click();
    cy.get('.modal').should('be.visible');
    cy.get('input[placeholder="Wpisz nową nazwę użytkownika"]').type('ab');
    cy.get('.modal-footer').contains('Zapisz').click();
    cy.get('div.text-center').should('contain', 'Nazwa użytkownika musi mieć co najmniej trzy znaki.');
    cy.get('input[placeholder="Wpisz nową nazwę użytkownika"]').clear().type('Test User');
    cy.get('.modal-footer').contains('Zapisz').click();
    cy.get('div.text-center').should('contain', 'Nazwa użytkownika nie może zawierać spacji.');
    cy.get('input[placeholder="Wpisz nową nazwę użytkownika"]').clear();
    cy.get('.modal-footer').contains('Zapisz').click();
    cy.get('div.text-center').should('contain', 'Proszę wpisać nową nazwę użytkownika');
  });

  it('powinna edytować ogłoszenie samochodu', () => {
    cy.intercept('PUT', 'https://localhost:5001/api/CarListings/1', {
      statusCode: 200,
      body: { message: 'Ogłoszenie zaktualizowane pomyślnie!' },
    }).as('updateCarListing');

    cy.intercept('GET', 'https://localhost:5001/api/CarListings/user', {
      statusCode: 200,
      body: [{
        id: 1,
        brand: 'NowaToyota',
        engineCapacity: 2.0,
        fuelType: 'benzyna',
        seats: 5,
        carType: 'sedan',
        features: ['GPS', 'Podgrzewane fotele'],
        latitude: 51.4011,
        longitude: 16.2015,
        userId: 123,
        rentalPricePerDay: 100,
        isAvailable: true,
        isApproved: true,
      }],
    }).as('getUpdatedCarListings');

    cy.intercept('GET', 'https://localhost:5001/api/CarListings/user').as('getCarListings');
    cy.visit('/profile');
    cy.wait('@getCarListings');
    cy.wait('@reverseGeocoding');
    cy.scrollTo('bottom');
    cy.get('tbody tr').first().find('button').contains('Edytuj').click();
    cy.get('.modal').should('be.visible');
    cy.get('.modal-title').should('contain', 'Edytuj ogłoszenie');
    cy.get('input[name="brand"]').clear().type('NowaToyota');
    cy.get('input[placeholder="Wpisz dodatek"]').type('Klimatyzacja{enter}');
    cy.contains('Klimatyzacja').parent().find('button').click();

    cy.scrollTo('bottom');

    cy.get('.modal-footer').find('button').contains('Zapisz zmiany').click();

    cy.wait('@updateCarListing').its('response.statusCode').should('eq', 200);
    cy.wait('@getUpdatedCarListings');
    cy.get('.modal').should('not.exist');

    cy.get('tbody tr').first().within(() => {
      cy.contains('NowaToyota').should('be.visible');
      cy.contains('GPS, Podgrzewane fotele').should('be.visible');
    });
  });

  it('powinna usunąć ogłoszenie samochodu', () => {
    cy.intercept('DELETE', 'https://localhost:5001/api/CarListings/1', {
      statusCode: 200,
      body: { message: 'Ogłoszenie usunięte pomyślnie.' },
    }).as('deleteCarListing');

    cy.intercept('GET', 'https://localhost:5001/api/CarListings/user').as('getCarListings');
    cy.visit('/profile');
    cy.wait('@getCarListings');
    cy.wait('@reverseGeocoding');
    cy.get('tbody tr').should('have.length', 2);
    cy.get('tbody tr').first().find('button').contains('Usuń').click();
    cy.get('.modal').should('be.visible');
    cy.get('.modal-title').should('contain', 'Potwierdź usunięcie');
    cy.get('.modal-footer').contains('Usuń').click();


    cy.wait('@deleteCarListing').its('response.statusCode').should('eq', 200);
    cy.get('div.text-center').should('contain', 'Ogłoszenie usunięte pomyślnie.');
    cy.get('tbody tr').should('have.length', 1);
    cy.get('tbody tr').contains('Honda').should('be.visible');
  });

  it('powinna zmienić dostępność samochodu', () => {
    cy.intercept('PUT', 'https://localhost:5001/api/CarListings/1/availability', {
      statusCode: 200,
      body: { message: 'Dostępność zmieniona pomyślnie!' },
    }).as('changeAvailability');

    cy.intercept('GET', 'https://localhost:5001/api/CarListings/user').as('getCarListings');
    cy.visit('/profile');
    cy.wait('@getCarListings');
    cy.wait('@reverseGeocoding');

    cy.get('tbody tr').first().find('button').contains('Dostępny').click();

    cy.wait('@changeAvailability').its('response.statusCode').should('eq', 200);
    cy.get('div.text-center').should('contain', 'Dostępność zmieniona pomyślnie!');
    cy.get('tbody tr').first().find('button').contains('Niedostępny').should('be.visible');
  });

  it('powinna przekierować do historii wypożyczeń', () => {
    cy.intercept('GET', 'https://localhost:5001/api/CarListings/user').as('getCarListings');
    cy.visit('/profile');
    cy.wait('@getCarListings');

    cy.get('button').contains('Zobacz historię wypożyczeń').click();
    
    cy.url().should('include', '/rental-history');
  });
});