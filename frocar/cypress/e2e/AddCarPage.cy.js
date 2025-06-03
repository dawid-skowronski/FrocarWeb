describe('AddCarPage', () => {
  Cypress.on('uncaught:exception', (err, runnable) => {
    console.error('Nieoczekiwany wyjątek:', err.message);
    return false;
  });

  const loginAndVisitAddCarPage = () => {
    cy.request({
      method: 'POST',
      url: 'https://localhost:5001/api/Account/login',
      body: {
        username: 'Kozub',
        password: 'Qwerty123!'
      },
      failOnStatusCode: false
    }).then((loginResponse) => {
      if (loginResponse.status !== 200) {
        cy.request({
          method: 'POST',
          url: 'https://localhost:5001/api/Account/register',
          body: {
            Username: 'Kozub',
            Email: 'kozub@example.com',
            Password: 'Qwerty123!',
          },
          failOnStatusCode: false
        });
      }
    });
    cy.visit('/login');
    
    cy.get('input[name="username"]').should('exist').type('Kozub', { delay: 50 });
    cy.get('input[name="password"]').should('exist').type('Qwerty123!', { delay: 50 });

    cy.screenshot('before-login-submit');
    
    cy.get('button[type="submit"]').should('be.visible').click();


    cy.url().should('not.include', '/login', { timeout: 15000 });
    cy.getCookie('token').should('exist');

    cy.intercept('GET', 'https://localhost:5001/api/CarRental/user', {
      statusCode: 200,
      body: { userId: '123', username: 'Kozub', email: 'kozub@example.com' },
    }).as('getUser');

    cy.intercept('GET', 'https://localhost:5001/api/Account/Notification', {
      statusCode: 200,
      body: { notifications: [] },
    }).as('getNotifications');

    cy.intercept('GET', 'https://maps.googleapis.com/maps/api/geocode/json?address=*', {
      statusCode: 200,
      body: {
        status: 'OK',
        results: [{
          formatted_address: 'Orla 70, 59-300 Lubin, Poland',
          geometry: { location: { lat: 51.4011, lng: 16.2015 } },
        }],
      },
    }).as('geocodeAddress');

    cy.intercept('GET', 'https://maps.googleapis.com/maps/api/geocode/json?latlng=*', {
      statusCode: 200,
      body: {
        status: 'OK',
        results: [{ formatted_address: 'Orla 70, 59-300 Lubin, Poland' }],
      },
    }).as('reverseGeocode');

    cy.visit('/add-car');
    cy.get('h1').should('contain', 'Dodaj Samochód', { timeout: 15000 });
    cy.get('form').should('be.visible');
  };

  const loginUser = () => {

    cy.request({
      method: 'POST',
      url: 'https://localhost:5001/api/Account/login',
      body: {
        username: 'Kozub',
        password: 'Qwerty123!'
      },
      failOnStatusCode: false
    }).then((loginResponse) => {
      if (loginResponse.status !== 200) {
        cy.request({
          method: 'POST',
          url: 'https://localhost:5001/api/Account/register',
          body: {
            Username: 'Kozub',
            Email: 'kozub@example.com',
            Password: 'Qwerty123!',
          },
          failOnStatusCode: false
        });
      }
    });

    cy.visit('/login');
    cy.get('input[name="username"]').type('Kozub');
    cy.get('input[name="password"]').type('Qwerty123!');
    cy.get('button[type="submit"]').click();

    cy.url().should('not.include', '/login', { timeout: 15000 });
    cy.getCookie('token').should('exist');

    cy.intercept('GET', 'https://localhost:5001/api/CarRental/user', {
      statusCode: 200,
      body: { userId: '123', username: 'Kozub', email: 'kozub@example.com' },
    }).as('getUser');

    cy.intercept('GET', 'https://localhost:5001/api/Account/Notification', {
      statusCode: 200,
      body: { notifications: [] },
    }).as('getNotifications');
  };

  
  it('powinno poprawnie renderować formularz dodawania samochodu', () => {
    loginAndVisitAddCarPage();

    cy.get('h1').should('have.text', 'Dodaj Samochód');
    cy.get('input[name="brand"]').should('be.visible').and('have.attr', 'placeholder', 'Marka');
    cy.get('input[name="engineCapacity"]').should('be.visible').and('have.attr', 'placeholder', 'Pojemność Silnika (L)');
    cy.get('select[name="fuelType"]').should('be.visible').and('contain', 'Wybierz Rodzaj Paliwa');
    cy.get('input[name="seats"]').should('be.visible').and('have.attr', 'placeholder', 'Liczba Miejsc');
    cy.get('select[name="carType"]').should('be.visible').and('contain', 'Wybierz Typ Samochodu');
    cy.get('input[name="rentalPricePerDay"]').should('be.visible').and('have.attr', 'placeholder', 'Cena Wynajmu za Dzień (PLN)');
    cy.get('input#features').should('be.visible').and('have.attr', 'placeholder', 'Np. Klimatyzacja').and('not.be.disabled');
    cy.get('button').contains('Wybierz Lokalizację na Mapie').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible').and('have.text', 'Dodaj Ogłoszenie');
  });

  it('powinno wyświetlać błędy walidacji dla brakującej lokalizacji i niepoprawnej ceny', () => {
    loginAndVisitAddCarPage();

    cy.get('input[name="brand"]').type('Toyota');
    cy.get('input[name="engineCapacity"]').type('2.0');
    cy.get('select[name="fuelType"]').select('benzyna');
    cy.get('input[name="seats"]').type('5');
    cy.get('select[name="carType"]').select('sedan');

    cy.get('input[name="rentalPricePerDay"]').type('100');
    cy.get('button[type="submit"]').click();
    cy.get('div.alert', { timeout: 15000 }).should('contain', 'Błąd: Proszę wybrać lokalizację na mapie.');

    cy.get('button').contains('Wybierz Lokalizację na Mapie').click();
    cy.get('.modal').should('be.visible');
    cy.get('input#searchAddress').type('Lubin Orla 70');
    cy.get('button').contains('Szukaj').click();
    cy.wait('@geocodeAddress', { timeout: 6000 });
    cy.get('.modal-footer').find('button').contains('Zamknij').click();
    cy.get('.modal').should('not.exist');

    cy.get('input[name="rentalPricePerDay"]').clear().type('-10');
    cy.get('button[type="submit"]').click();
    cy.get('div.alert', { timeout: 15000 }).should('contain', 'Błąd: Cena wynajmu za dzień musi być większa od 0.');
  });

  it('powinno pozwalać na dodawanie i usuwanie dodatków', () => {
    loginAndVisitAddCarPage();

    cy.get('input[name="brand"]').type('Toyota');
    cy.get('input[name="engineCapacity"]').type('2.0');
    cy.get('select[name="fuelType"]').select('benzyna');
    cy.get('input[name="seats"]').type('5');
    cy.get('select[name="carType"]').select('sedan');
    cy.get('input[name="rentalPricePerDay"]').type('100');

    cy.get('input#features').should('be.visible').and('not.be.disabled').then(($input) => {
      if ($input.is(':disabled')) {
        cy.log('Input dodatków jest wyłączony, sprawdź logikę aplikacji.');
        cy.get('input#features').invoke('attr', 'disabled').then((disabled) => {
          cy.log(`Atrybut disabled: ${disabled}`);
        });
      }
    });

    cy.get('input#features').type('Klimatyzacja{enter}');
    cy.get('input#features').type('Nawigacja GPS{enter}');

    cy.get('.list-group-item').should('have.length', 2);
    cy.get('.list-group-item').eq(0).should('contain', 'Klimatyzacja');
    cy.get('.list-group-item').eq(1).should('contain', 'Nawigacja GPS');

    cy.get('.list-group-item').eq(0).find('button').contains('Usuń').click();
    cy.get('.list-group-item').should('have.length', 1);
    cy.get('.list-group-item').eq(0).should('contain', 'Nawigacja GPS');
  });

  it('powinno otwierać modal z mapą i wybierać lokalizację', () => {
    loginAndVisitAddCarPage();

    cy.get('button').contains('Wybierz Lokalizację na Mapie').click();
    cy.get('.modal').should('be.visible');
    cy.get('.modal-title').should('have.text', 'Wybierz Lokalizację');

    cy.get('input#searchAddress').type('Lubin Orla 70');
    cy.get('button').contains('Szukaj').click();
    cy.wait('@geocodeAddress', { timeout: 6000 });

    cy.get('.modal-footer').find('button').contains('Zamknij').click();
    cy.get('.modal').should('not.exist');

    cy.get('p').should('contain', 'Wybrana Lokalizacja: Orla 70, 59-300 Lubin, Poland');
  });

  it('powinno pomyślnie przesyłać formularz i przekierowywać na stronę główną', () => {
    loginAndVisitAddCarPage();

    cy.intercept('POST', 'https://localhost:5001/api/CarListings/create', {
      statusCode: 200,
      body: { message: 'Car added successfully' },
    }).as('createCar');

    cy.get('input[name="brand"]').type('Toyota');
    cy.get('input[name="engineCapacity"]').type('2.0');
    cy.get('select[name="fuelType"]').select('benzyna');
    cy.get('input[name="seats"]').type('5');
    cy.get('select[name="carType"]').select('sedan');
    cy.get('input[name="rentalPricePerDay"]').type('100');
    cy.get('input#features').type('Klimatyzacja{enter}');

    cy.get('button').contains('Wybierz Lokalizację na Mapie').click();
    cy.get('input#searchAddress').type('Lubin Orla 70');
    cy.get('button').contains('Szukaj').click();
    cy.wait('@geocodeAddress', { timeout: 6000 });
    cy.get('.modal-footer').find('button').contains('Zamknij').click();

    cy.get('button[type="submit"]').click();
    cy.get('div.alert', { timeout: 10000 }).should('contain', 'Samochód dodany pomyślnie! Przekierowanie na stronę główną...');

    cy.wait('@createCar', { timeout: 10000 }).its('request.body').should('deep.equal', {
      brand: 'Toyota',
      engineCapacity: 2.0,
      fuelType: 'benzyna',
      seats: 5,
      carType: 'sedan',
      features: ['Klimatyzacja'],
      rentalPricePerDay: 100,
      latitude: 51.4011,
      longitude: 16.2015,
    });

    cy.url({ timeout: 10000 }).should('eq', 'http://localhost:5173/');
  });

  it('powinno wyświetlać błąd serwera, gdy tworzenie samochodu się nie powiedzie', () => {
    loginAndVisitAddCarPage();

    cy.intercept('POST', 'https://localhost:5001/api/CarListings/create', {
      statusCode: 400,
      body: 'Invalid data provided',
    }).as('createCarFail');

    cy.get('input[name="brand"]').type('Toyota');
    cy.get('input[name="engineCapacity"]').type('2.0');
    cy.get('select[name="fuelType"]').select('benzyna');
    cy.get('input[name="seats"]').type('5');
    cy.get('select[name="carType"]').select('sedan');
    cy.get('input[name="rentalPricePerDay"]').type('100');

    cy.get('button').contains('Wybierz Lokalizację na Mapie').click();
    cy.get('input#searchAddress').type('Lubin Orla 70');
    cy.get('button').contains('Szukaj').click();
    cy.wait('@geocodeAddress', { timeout: 6000 });
    cy.get('.modal-footer').find('button').contains('Zamknij').click();

    cy.get('button[type="submit"]').click();
    cy.wait('@createCarFail', { timeout: 10000 });
    cy.get('div.alert', { timeout: 15000 }).should('contain', 'Błąd: Invalid data provided');
  });

  
});