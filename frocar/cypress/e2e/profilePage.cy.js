describe('Strona profilu użytkownika', () => {
  const DEFAULT_TIMEOUT = 15000;

  // Obsługa nieprzechwyconych wyjątków
  Cypress.on('uncaught:exception', (err, runnable) => {
    console.error('Nieprzechwycony wyjątek:', err.message);
    return false;
  });

  // Funkcja pomocnicza do logowania użytkownika
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

  // Funkcja pomocnicza do konfiguracji mocków API
  const ustawMocki = () => {
    // Mock API Google Maps
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

    // Mock listy samochodów użytkownika
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

  // Konfiguracja przed każdym testem
  beforeEach(() => {
    zalogujUzytkownika();
    ustawMocki();
  });

  it('powinna przekierować na stronę logowania dla niezalogowanego użytkownika', () => {
    cy.clearCookie('token');
    cy.visit('/profile');
    cy.get('div.text-center', { timeout: DEFAULT_TIMEOUT }).should(
      'contain',
      'Błąd: Nie jesteś zalogowany. Przekierowuję na stronę logowania...'
    );
    cy.url().should('include', '/login');
  });

  it('powinna poprawnie wyświetlić stronę profilu dla zalogowanego użytkownika', () => {
    cy.intercept('GET', 'https://localhost:5001/api/CarListings/user').as('getCarListings');
    cy.visit('/profile');
    
    cy.wait('@getCarListings').its('response.statusCode').should('eq', 200);
    cy.wait('@reverseGeocoding').its('response.statusCode').should('eq', 200);

    // Weryfikacja nagłówka i danych użytkownika
    cy.get('h1').should('have.text', 'Twój profil');
    cy.contains('Nazwa użytkownika: Kozub').should('be.visible');
    
    // Weryfikacja przycisków
    cy.get('button').contains('Zmień nazwę użytkownika').should('be.visible');
    cy.get('button').contains('Zobacz historię wypożyczeń').should('be.visible');
    
    // Weryfikacja filtrów
    cy.get('input[placeholder="Wpisz markę"]').should('be.visible');
    cy.get('select').should('have.value', 'all');
    
    // Weryfikacja tabeli z samochodami
    cy.get('table').should('be.visible');
    cy.get('tbody tr').should('have.length', 2);
    
    // Weryfikacja pierwszego samochodu
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

    // Filtrowanie po marce
    cy.get('input[placeholder="Wpisz markę"]').type('Toyota');
    cy.get('tbody tr').should('have.length', 1);
    cy.get('tbody tr').contains('Toyota').should('be.visible');
    cy.get('tbody tr').contains('Honda').should('not.exist');

    // Resetowanie filtra marki
    cy.get('input[placeholder="Wpisz markę"]').clear();
    cy.get('tbody tr').should('have.length', 2);

    // Filtrowanie po dostępności
    cy.get('select').select('available');
    cy.get('tbody tr').should('have.length', 1);
    cy.get('tbody tr').contains('Toyota').should('be.visible');
    cy.get('tbody tr').contains('Honda').should('not.exist');

    cy.get('select').select('unavailable');
    cy.get('tbody tr').should('have.length', 1);
    cy.get('tbody tr').contains('Honda').should('be.visible');
    cy.get('tbody tr').contains('Toyota').should('not.exist');

    // Resetowanie wszystkich filtrów
    cy.get('select').select('all');
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

    // Otwarcie modala zmiany nazwy
    cy.get('button').contains('Zmień nazwę użytkownika').click();
    cy.get('.modal').should('be.visible');
    cy.get('.modal-title').should('contain', 'Zmień nazwę użytkownika');
    
    // Wprowadzenie nowej nazwy i zapis
    cy.get('input[placeholder="Wpisz nową nazwę użytkownika"]').type('NowyTestUser');
    cy.get('.modal-footer').contains('Zapisz').click();
    
    // Weryfikacja
    cy.wait('@changeUsername').its('response.statusCode').should('eq', 200);
    cy.get('div.text-center').should('contain', 'Nazwa użytkownika zmieniona pomyślnie!');
    cy.get('.modal').should('not.exist');
  });

  it('powinna wyświetlać błędy dla nieprawidłowej nazwy użytkownika', () => {
    cy.intercept('GET', 'https://localhost:5001/api/CarListings/user').as('getCarListings');
    cy.visit('/profile');
    cy.wait('@getCarListings');

    // Otwarcie modala zmiany nazwy
    cy.get('button').contains('Zmień nazwę użytkownika').click();
    cy.get('.modal').should('be.visible');

    // Test zbyt krótkiej nazwy
    cy.get('input[placeholder="Wpisz nową nazwę użytkownika"]').type('ab');
    cy.get('.modal-footer').contains('Zapisz').click();
    cy.get('div.text-center').should('contain', 'Błąd: Nazwa użytkownika musi mieć co najmniej 3 znaki.');

    // Test nazwy ze spacją
    cy.get('input[placeholder="Wpisz nową nazwę użytkownika"]').clear().type('Test User');
    cy.get('.modal-footer').contains('Zapisz').click();
    cy.get('div.text-center').should('contain', 'Błąd: Nazwa użytkownika nie może zawierać spacji.');

    // Test pustej nazwy
    cy.get('input[placeholder="Wpisz nową nazwę użytkownika"]').clear();
    cy.get('.modal-footer').contains('Zapisz').click();
    cy.get('div.text-center').should('contain', 'Błąd: Nazwa użytkownika nie może być pusta.');
  });

  it('powinna edytować ogłoszenie samochodu', () => {
    // Mockowanie odpowiedzi
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

    // Otwarcie modala edycji
    cy.get('tbody tr').first().find('button').contains('Edytuj').click();
    cy.get('.modal').should('be.visible');
    cy.get('.modal-title').should('contain', 'Edytuj ogłoszenie');

    // Modyfikacja danych
    cy.get('input[name="brand"]').clear().type('NowaToyota');
    cy.get('input[placeholder="Wpisz dodatek"]').type('Klimatyzacja{enter}');
    cy.contains('Klimatyzacja').parent().find('button').click();

    // Przewinięcie strony na dół przed zapisem
    cy.scrollTo('bottom');

    // Zapis zmian
    cy.get('.modal-footer').find('button').contains('Zapisz zmiany').click();

    // Weryfikacja
    cy.wait('@updateCarListing').its('response.statusCode').should('eq', 200);
    cy.wait('@getUpdatedCarListings');
    cy.get('.modal').should('not.exist');

    // Weryfikacja zaktualizowanych danych
    cy.get('tbody tr').first().within(() => {
      cy.contains('NowaToyota').should('be.visible');
      cy.contains('GPS, Podgrzewane fotele').should('be.visible');
    });
  });

  it('powinna usunąć ogłoszenie samochodu', () => {
    cy.intercept('DELETE', 'https://localhost:5001/api/CarListings/1', {
      statusCode: 200,
      body: { message: 'Samochód usunięty pomyślnie.' },
    }).as('deleteCarListing');

    cy.intercept('GET', 'https://localhost:5001/api/CarListings/user').as('getCarListings');
    cy.visit('/profile');
    cy.wait('@getCarListings');
    cy.wait('@reverseGeocoding');

    // Weryfikacja liczby samochodów przed usunięciem
    cy.get('tbody tr').should('have.length', 2);

    // Inicjacja usuwania
    cy.get('tbody tr').first().find('button').contains('Usuń').click();
    cy.get('.modal').should('be.visible');
    cy.get('.modal-title').should('contain', 'Potwierdź usunięcie');
    
    // Potwierdzenie usunięcia
    cy.get('.modal-footer').contains('Usuń').click();

    // Weryfikacja
    cy.wait('@deleteCarListing').its('response.statusCode').should('eq', 200);
    cy.get('div.text-center').should('contain', 'Samochód został usunięty pomyślnie.');
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

    // Zmiana dostępności
    cy.get('tbody tr').first().find('button').contains('Dostępny').click();

    // Weryfikacja
    cy.wait('@changeAvailability').its('response.statusCode').should('eq', 200);
    cy.get('div.text-center').should('contain', 'Dostępność zmieniona pomyślnie!');
    cy.get('tbody tr').first().find('button').contains('Niedostępny').should('be.visible');
  });

  it('powinna przekierować do historii wypożyczeń', () => {
    cy.intercept('GET', 'https://localhost:5001/api/CarListings/user').as('getCarListings');
    cy.visit('/profile');
    cy.wait('@getCarListings');

    // Kliknięcie przycisku historii wypożyczeń
    cy.get('button').contains('Zobacz historię wypożyczeń').click();
    
    // Weryfikacja przekierowania
    cy.url().should('include', '/rental-history');
  });
});