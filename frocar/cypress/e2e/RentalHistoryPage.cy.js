describe('RentalHistoryPage', () => {
  // Obsługa nieoczekiwanych wyjątków
  Cypress.on('uncaught:exception', (err, runnable) => {
    console.error('Nieoczekiwany wyjątek:', err.message);
    return false;
  });

  // Funkcja pomocnicza do logowania
  const loginUser = () => {
    cy.request({
      method: 'POST',
      url: 'https://localhost:5001/api/Account/login',
      body: {
        username: 'Kozub',
        password: 'Qwerty123!',
      },
      failOnStatusCode: false,
    }).then((loginResponse) => {
      if (loginResponse.status !== 200) {
        cy.log('Logowanie nie powiodło się, rejestracja użytkownika...');
        cy.request({
          method: 'POST',
          url: 'https://localhost:5001/api/Account/register',
          body: {
            Username: 'Kozub',
            Email: 'tytaj04@gmail.com',
            Password: 'Qwerty123!',
          },
          failOnStatusCode: false,
        });
      }
      cy.setCookie('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJUZXN0VXNlciIsImV4cCI6MTczNTE0NzQwMH0.signature');
    });

    cy.intercept('GET', 'https://localhost:5001/api/CarRental/user', {
      statusCode: 200,
      body: { userId: '123', username: 'Kozub', email: 'tytaj04@gmail.com' },
    }).as('getUser');

    cy.intercept('GET', 'https://localhost:5001/api/Account/Notification', {
      statusCode: 200,
      body: { notifications: [] },
    }).as('getNotifications');
  };

  // Funkcja pomocnicza do mockowania API
  const setupMocks = () => {
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
    }).as('reverseGeocode');
  };

  beforeEach(() => {
    loginUser();
    setupMocks();
  });

  it('powinno poprawnie renderować pojedyncze wypożyczenie w historii wypożyczeń dla zalogowanego użytkownika', () => {
    cy.intercept('GET', 'https://localhost:5001/api/CarRental/user/history', {
      statusCode: 200,
      body: [
        {
          carRentalId: 150,
          carListing: {
            id: 150,
            brand: 'Toyota',
            carType: 'sedan',
            rentalPricePerDay: 100,
            engineCapacity: 2.0,
            fuelType: 'benzyna',
            seats: 5,
            features: ['Klimatyzacja', 'GPS'],
            latitude: 52.2297,
            longitude: 21.0122,
            userId: 123,
            isAvailable: true,
            isApproved: true,
          },
          rentalStartDate: '2023-10-01',
          rentalEndDate: '2023-10-10',
          rentalStatus: 'Ended',
          userId: 123,
        },
      ],
    }).as('getRentalHistory');

    cy.intercept('GET', 'https://localhost:5001/api/CarRental/reviews/20', {
      statusCode: 200,
      body: [
        {
          reviewId: 1,
          carRentalId: 20,
          userId: 123,
          rating: 5,
          comment: 'Świetny samochód!',
          user: { id: 123, userName: 'Kozub' },
        },
      ],
    }).as('getReviews');

    cy.visit('/rental-history');
    cy.wait(['@getUser', '@getNotifications', '@getRentalHistory'], { timeout: 8000 });

    cy.get('h1').should('have.text', 'Historia wypożyczeń');
    cy.get('table').should('exist').as('historyTable');
    cy.get('@historyTable').find('tbody').should('exist');
    cy.get('@historyTable').find('tbody tr').should('have.length', 1).as('rentalRows');

    cy.get('@rentalRows').first().within(() => {
      cy.contains('Toyota').should('be.visible');
      cy.contains('sedan').should('be.visible');
      cy.contains(/01\.10\.2023/).should('be.visible');
      cy.contains(/10\.10\.2023/).should('be.visible');
      cy.contains('Ended').should('be.visible');
      cy.contains('Oczekuje').should('be.visible');
    });

    cy.screenshot('rental-history-rendered');
  });

  it('powinno wyświetlać komunikat o braku historii wypożyczeń', () => {
    cy.intercept('GET', 'https://localhost:5001/api/CarRental/user/history', {
      statusCode: 200,
      body: [],
    }).as('getRentalHistory');

    cy.visit('/rental-history');
    cy.wait(['@getUser', '@getNotifications', '@getRentalHistory'], { timeout: 8000 });

    cy.get('div.text-center.mb-3.d-flex.justify-content-between.align-items-center', { timeout: 10000 })
      .should('be.visible')
      .and('contain', 'Informacja: Nie masz jeszcze zakończonych wypożyczeń.')
      .then(() => {
        cy.screenshot('no-rental-history');
        cy.log('No rental history message displayed');
      }, () => {
        cy.screenshot('no-rental-history-failure');
        cy.log('Failed to find no rental history message');
      });
  });

  it('powinno wyświetlać komunikat o błędzie przy pobieraniu historii wypożyczeń', () => {
  cy.intercept('GET', 'https://localhost:5001/api/CarRental/user/history', {
    statusCode: 500,
    body: { message: 'Wystąpił błąd serwera' }, // To już nie ma wpływu na komunikat
  }).as('getRentalHistory');

  cy.visit('/rental-history');
  cy.wait(['@getUser', '@getNotifications', '@getRentalHistory'], { timeout: 10000 });

  cy.get('div.text-center.mb-3.d-flex.justify-content-between.align-items-center', { timeout: 10000 })
    .should('be.visible')
    .and('contain', 'Błąd: Nie udało się pobrać historii wypożyczeń. Spróbuj ponownie później lub skontaktuj się z pomocą techniczną.')
    .then(() => {
      cy.get('button').contains('Spróbuj ponownie').should('be.visible');
      cy.screenshot('rental-history-error');
      cy.log('Error message displayed');
    }, () => {
      cy.screenshot('rental-history-error-failure');
      cy.log('Failed to find error message');
    });
});

  it('powinno przekierować do szczegółów wypożyczenia', () => {
    cy.intercept('GET', 'https://localhost:5001/api/CarRental/user/history', {
      statusCode: 200,
      body: [
        {
          carRentalId: 1,
          carListing: {
            id: 1,
            brand: 'Toyota',
            carType: 'sedan',
            rentalPricePerDay: 100,
            engineCapacity: 2.0,
            fuelType: 'benzyna',
            seats: 5,
            features: ['Klimatyzacja', 'GPS'],
            latitude: 52.2297,
            longitude: 21.0122,
            userId: 123,
            isAvailable: true,
            isApproved: true,
          },
          rentalStartDate: '2023-10-01',
          rentalEndDate: '2023-10-10',
          rentalStatus: 'Ended',
          userId: 123,
        },
      ],
    }).as('getRentalHistory');

    cy.visit('/rental-history');
    cy.wait(['@getUser', '@getNotifications', '@getRentalHistory'], { timeout: 8000 });

    cy.get('tbody tr').first().click();
    cy.url({ timeout: 8000 }).should('include', '/rentals/1').then(() => {
      cy.screenshot('rental-details-redirect');
      cy.log('Successfully redirected to rental details');
    }, () => {
      cy.screenshot('rental-details-redirect-failure');
      cy.log('Failed to redirect to rental details');
    });
  });
});