describe('RentalsPage', () => {
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
      cy.setCookie('token', 'fakeToken');
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

  beforeEach(() => {
    loginUser();
    cy.visit('/');
    cy.wait(1000); // Dodaj opóźnienie
  });

  it('powinno poprawnie renderować stronę wypożyczeń dla zalogowanego użytkownika', () => {
    // Mock listy wypożyczeń
    cy.intercept('GET', 'https://localhost:5001/api/CarRental/user', {
      statusCode: 200,
      body: [
        {
          carRentalId: 1,
          carListing: {
            brand: 'Toyota',
            carType: 'sedan',
            rentalPricePerDay: 100,
          },
          rentalStartDate: '2023-10-01',
          rentalEndDate: '2023-10-10',
          rentalStatus: 'Active',
        },
        {
          carRentalId: 2,
          carListing: {
            brand: 'Honda',
            carType: 'hatchback',
            rentalPricePerDay: 80,
          },
          rentalStartDate: '2023-10-05',
          rentalEndDate: '2023-10-15',
          rentalStatus: 'Active',
        },
      ],
    }).as('getRentals');

    // Wejdź na RentalsPage
    cy.visit('/rentals');
    cy.wait(1000); // Dodaj opóźnienie
    cy.wait('@getRentals');

    // Sprawdź nagłówek
    cy.get('h2').should('have.text', 'Moje wypożyczenia');
    cy.wait(1000); // Dodaj opóźnienie

    // Sprawdź przycisk odświeżania
    cy.get('button').contains('Odśwież').should('be.visible');
    cy.wait(1000); // Dodaj opóźnienie

    // Sprawdź listę wypożyczeń
    cy.get('.list-group-item').should('have.length', 2);
    cy.wait(1000); // Dodaj opóźnienie
    cy.get('.list-group-item').first().within(() => {
      cy.contains('Toyota (sedan)').should('be.visible');
      cy.wait(500); // Dodaj opóźnienie
      cy.contains(/Od: \d{2}\.\d{2}\.\d{4}/).should('be.visible');
      cy.wait(500); // Dodaj opóźnienie
      cy.contains(/Do: \d{2}\.\d{2}\.\d{4}/).should('be.visible');
      cy.wait(500); // Dodaj opóźnienie
      cy.contains('Status: Active').should('be.visible');
      cy.wait(500); // Dodaj opóźnienie
      cy.contains('Cena za dzień: 100 zł').should('be.visible');
      cy.wait(500); // Dodaj opóźnienie
      cy.contains('Szczegóły').should('be.visible');
      cy.wait(500); // Dodaj opóźnienie
      cy.contains('Anuluj').should('be.visible');
    });
  });

  it('powinno wyświetlać komunikat o braku aktywnych wypożyczeń', () => {
    // Mock pustej listy wypożyczeń
    cy.intercept('GET', 'https://localhost:5001/api/CarRental/user', {
      statusCode: 200,
      body: [],
    }).as('getRentals');

    cy.visit('/rentals');
    cy.wait(1000);
    cy.wait('@getRentals');

    cy.contains('Informacja: Nie masz aktywnych wypożyczeń.').should('be.visible');
    cy.wait(1000);
  });

  it('powinno wyświetlać komunikat o błędzie przy pobieraniu wypożyczeń', () => {
    // Mock błędu przy pobieraniu wypożyczeń
    cy.intercept('GET', 'https://localhost:5001/api/CarRental/user', {
      statusCode: 500,
      body: { message: 'Wystąpił błąd serwera' },
    }).as('getRentals');

    cy.visit('/rentals');
    cy.wait(1000);
    cy.wait('@getRentals');

    cy.contains('Błąd: Problem po stronie serwera. {"message":"Wystąpił błąd serwera"}').should('be.visible');
    cy.wait(1000);
  });

  it('powinno anulować wypożyczenie', () => {
    // Mock listy wypożyczeń
    cy.intercept('GET', 'https://localhost:5001/api/CarRental/user', {
      statusCode: 200,
      body: [
        {
          carRentalId: 1,
          carListing: {
            brand: 'Toyota',
            carType: 'sedan',
            rentalPricePerDay: 100,
          },
          rentalStartDate: '2023-10-01',
          rentalEndDate: '2023-10-10',
          rentalStatus: 'Active',
        },
      ],
    }).as('getRentals');

    // Mock anulowania wypożyczenia
    cy.intercept('DELETE', 'https://localhost:5001/api/CarRental/1', {
      statusCode: 200,
      body: { message: 'Wypożyczenie zostało anulowane' },
    }).as('cancelRental');

    cy.visit('/rentals');
    cy.wait(1000);
    cy.wait('@getRentals');

    cy.get('.list-group-item').first().contains('Anuluj').click();
    cy.wait(1000);
    cy.wait('@cancelRental');

    cy.contains('Sukces: Wypożyczenie zostało anulowane.').should('be.visible');
    cy.wait(1000);
    cy.get('.list-group-item').should('have.length', 0);
  });

  it('powinno wyświetlać komunikat o błędzie przy anulowaniu wypożyczenia', () => {
    // Mock listy wypożyczeń
    cy.intercept('GET', 'https://localhost:5001/api/CarRental/user', {
      statusCode: 200,
      body: [
        {
          carRentalId: 1,
          carListing: {
            brand: 'Toyota',
            carType: 'sedan',
            rentalPricePerDay: 100,
          },
          rentalStartDate: '2023-10-01',
          rentalEndDate: '2023-10-10',
          rentalStatus: 'Active',
        },
      ],
    }).as('getRentals');

    // Mock błędu przy anulowaniu wypożyczenia
    cy.intercept('DELETE', 'https://localhost:5001/api/CarRental/1', {
      statusCode: 500,
      body: { message: 'Wystąpił błąd serwera' },
    }).as('cancelRental');

    cy.visit('/rentals');
    cy.wait(1000);
    cy.wait('@getRentals');

    cy.get('.list-group-item').first().contains('Anuluj').click();
    cy.wait(1000);
    cy.wait('@cancelRental');

    cy.contains('Błąd: Problem po stronie serwera. {"message":"Wystąpił błąd serwera"}').should('be.visible');
    cy.wait(1000);
  });

  it('powinno przekierować do szczegółów wypożyczenia', () => {
  // Mock listy wypożyczeń
  cy.intercept('GET', 'https://localhost:5001/api/CarRental/user', {
    statusCode: 200,
    body: [
      {
        carRentalId: 1,
        carListing: {
          brand: 'Toyota',
          carType: 'sedan',
          rentalPricePerDay: 100,
        },
        rentalStartDate: '2023-10-01',
        rentalEndDate: '2023-10-10',
        rentalStatus: 'Active',
      },
    ],
  }).as('getRentals');

  // Wejdź na RentalsPage
  cy.visit('/rentals');
  cy.wait(1000); // Opóźnienie, aby zobaczyć ładowanie strony
  cy.log('Strona wypożyczeń załadowana');
  cy.wait('@getRentals');

  // Kliknij "Szczegóły" dla pierwszego wypożyczenia
  cy.log('Kliknięcie przycisku "Szczegóły"');
  cy.get('.list-group-item').first().contains('Szczegóły').click();
  cy.wait(1000); // Opóźnienie, aby zobaczyć przejście do szczegółów

  // Sprawdź przekierowanie na stronę szczegółów wypożyczenia
  cy.url().should('include', '/rentals/1');
  cy.log('Przekierowano do strony szczegółów wypożyczenia');
});

});
