describe('RentalDetailsPage', () => {
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
    cy.wait(1000); // Opóźnienie, aby zobaczyć logowanie
    cy.visit('/');
    cy.wait(1000); // Opóźnienie, aby zobaczyć przekierowanie na stronę główną
  });

  it('powinno poprawnie renderować stronę szczegółów wypożyczenia dla zalogowanego użytkownika', () => {
    // Mock szczegółów wypożyczenia
    cy.intercept('GET', 'https://localhost:5001/api/CarRental/1', {
      statusCode: 200,
      body: {
        carRentalId: 1,
        carListing: {
          brand: 'Toyota',
          carType: 'sedan',
          rentalPricePerDay: 100,
          engineCapacity: 2.0,
          fuelType: 'benzyna',
          seats: 5,
          features: ['Klimatyzacja', 'GPS'],
        },
        rentalStartDate: '2023-10-01',
        rentalEndDate: '2023-10-10',
        userId: 123,
        rentalStatus: 'Aktywne',
      },
    }).as('getRentalDetails');

    // Wejdź na RentalDetailsPage
    cy.visit('/rentals/1');
    cy.wait(1000); // Opóźnienie, aby zobaczyć ładowanie strony
    cy.wait('@getRentalDetails');

    // Sprawdź nagłówek
    cy.get('h2').should('have.text', 'Szczegóły wypożyczenia');
    cy.wait(1000); // Opóźnienie, aby zobaczyć nagłówek

    // Sprawdź przycisk "Wróć"
    cy.get('button').contains('Wróć').should('be.visible');
    cy.wait(1000); // Opóźnienie, aby zobaczyć przycisk

    // Sprawdź szczegóły wypożyczenia
    cy.contains('Toyota (sedan)').should('be.visible');
    cy.wait(500); // Opóźnienie, aby zobaczyć szczegóły
    cy.contains(/Od: \d{2}\.\d{2}\.\d{4}/).should('be.visible');
    cy.wait(500);
    cy.contains(/Do: \d{2}\.\d{2}\.\d{4}/).should('be.visible');
    cy.wait(500);
    cy.contains('Czas trwania: 9 dni').should('be.visible');
    cy.wait(500);
    cy.contains('Status: Aktywne').should('be.visible');
    cy.wait(500);
    cy.contains('Cena za dzień: 100 zł').should('be.visible');
    cy.wait(500);
    cy.contains('Całkowity koszt: 900 zł').should('be.visible');
    cy.wait(500);
    cy.contains('Pojemność silnika: 2L').should('be.visible');
    cy.wait(500);
    cy.contains('Typ paliwa: benzyna').should('be.visible');
    cy.wait(500);
    cy.contains('Liczba miejsc: 5').should('be.visible');
    cy.wait(500);
    cy.contains('Dodatki: Klimatyzacja, GPS').should('be.visible');

    // Sprawdź przycisk "Anuluj wypożyczenie"
    cy.get('button').contains('Anuluj wypożyczenie').should('be.visible');
    cy.wait(1000); // Opóźnienie, aby zobaczyć przycisk
  });

  it('powinno wyświetlać komunikat o błędzie przy pobieraniu szczegółów wypożyczenia', () => {
    // Mock błędu przy pobieraniu szczegółów wypożyczenia
    cy.intercept('GET', 'https://localhost:5001/api/CarRental/1', {
      statusCode: 500,
      body: { message: 'Wystąpił błąd serwera' },
    }).as('getRentalDetails');

    // Wejdź na RentalDetailsPage
    cy.visit('/rentals/1');
    cy.wait(1000);
    cy.wait('@getRentalDetails');

    // Sprawdź komunikat o błędzie
    cy.contains('Wystąpił błąd serwera').should('be.visible');
    cy.wait(1000);

    // Sprawdź przycisk "Wróć"
    cy.get('button').contains('Wróć').should('be.visible');
  });

  it('powinno anulować wypożyczenie', () => {
    // Mock szczegółów wypożyczenia
    cy.intercept('GET', 'https://localhost:5001/api/CarRental/1', {
      statusCode: 200,
      body: {
        carRentalId: 1,
        carListing: {
          brand: 'Toyota',
          carType: 'sedan',
          rentalPricePerDay: 100,
          engineCapacity: 2.0,
          fuelType: 'benzyna',
          seats: 5,
          features: ['Klimatyzacja', 'GPS'],
        },
        rentalStartDate: '2023-10-01',
        rentalEndDate: '2023-10-10',
        userId: 123,
        rentalStatus: 'Aktywne',
      },
    }).as('getRentalDetails');

    // Mock anulowania wypożyczenia
    cy.intercept('DELETE', 'https://localhost:5001/api/CarRental/1', {
      statusCode: 200,
      body: { message: 'Wypożyczenie zostało anulowane' },
    }).as('cancelRental');

    // Wejdź na RentalDetailsPage
    cy.visit('/rentals/1');
    cy.wait(1000);
    cy.wait('@getRentalDetails');

    // Kliknij "Anuluj wypożyczenie"
    cy.get('button').contains('Anuluj wypożyczenie').click();
    cy.wait(1000);
    cy.wait('@cancelRental');

    // Sprawdź komunikat o sukcesie
    cy.contains('Wypożyczenie zostało anulowane.').should('be.visible');
    cy.wait(1000);
  });

  it('powinno wyświetlać komunikat o błędzie przy anulowaniu wypożyczenia', () => {
    // Mock szczegółów wypożyczenia
    cy.intercept('GET', 'https://localhost:5001/api/CarRental/1', {
      statusCode: 200,
      body: {
        carRentalId: 1,
        carListing: {
          brand: 'Toyota',
          carType: 'sedan',
          rentalPricePerDay: 100,
          engineCapacity: 2.0,
          fuelType: 'benzyna',
          seats: 5,
          features: ['Klimatyzacja', 'GPS'],
        },
        rentalStartDate: '2023-10-01',
        rentalEndDate: '2023-10-10',
        userId: 123,
        rentalStatus: 'Aktywne',
      },
    }).as('getRentalDetails');

    // Mock błędu przy anulowaniu wypożyczenia
    cy.intercept('DELETE', 'https://localhost:5001/api/CarRental/1', {
      statusCode: 500,
      body: { message: 'Wystąpił błąd serwera' },
    }).as('cancelRental');

    // Wejdź na RentalDetailsPage
    cy.visit('/rentals/1');
    cy.wait(1000);
    cy.wait('@getRentalDetails');

    // Kliknij "Anuluj wypożyczenie"
    cy.get('button').contains('Anuluj wypożyczenie').click();
    cy.wait(1000);
    cy.wait('@cancelRental');

    // Sprawdź komunikat o błędzie
    cy.contains('Wystąpił błąd serwera').should('be.visible');
    cy.wait(1000);
  });

  it('powinno wystawić recenzję dla zakończonego wypożyczenia', () => {
    // Mock szczegółów wypożyczenia
    cy.intercept('GET', 'https://localhost:5001/api/CarRental/1', {
      statusCode: 200,
      body: {
        carRentalId: 1,
        carListing: {
          brand: 'Toyota',
          carType: 'sedan',
          rentalPricePerDay: 100,
          engineCapacity: 2.0,
          fuelType: 'benzyna',
          seats: 5,
          features: ['Klimatyzacja', 'GPS'],
        },
        rentalStartDate: '2023-10-01',
        rentalEndDate: '2023-10-10',
        userId: 123,
        rentalStatus: 'Zakończone',
      },
    }).as('getRentalDetails');

    // Mock recenzji
    cy.intercept('GET', 'https://localhost:5001/api/CarRental/reviews/1', {
      statusCode: 200,
      body: [],
    }).as('getReviews');

    // Mock dodawania recenzji
    cy.intercept('POST', 'https://localhost:5001/api/CarRental/review', {
      statusCode: 200,
      body: { message: 'Recenzja została dodana pomyślnie!' },
    }).as('submitReview');

    // Wejdź na RentalDetailsPage
    cy.visit('/rentals/1');
    cy.wait(1000);
    cy.wait('@getRentalDetails');

    // Wystaw recenzję
    cy.get('.me-1').first().click(); // Kliknij pierwszą gwiazdkę
    cy.wait(500);
    cy.get('textarea').type('Świetny samochód!');
    cy.wait(500);
    cy.get('button').contains('Wyślij recenzję').click();
    cy.wait(1000);
    cy.wait('@submitReview');

    // Sprawdź komunikat o sukcesie
    cy.contains('Recenzja została dodana pomyślnie!').should('be.visible');
    cy.wait(1000);
  });

  it('powinno wyświetlać komunikat o błędzie przy wystawianiu recenzji', () => {
    // Mock szczegółów wypożyczenia
    cy.intercept('GET', 'https://localhost:5001/api/CarRental/1', {
      statusCode: 200,
      body: {
        carRentalId: 1,
        carListing: {
          brand: 'Toyota',
          carType: 'sedan',
          rentalPricePerDay: 100,
          engineCapacity: 2.0,
          fuelType: 'benzyna',
          seats: 5,
          features: ['Klimatyzacja', 'GPS'],
        },
        rentalStartDate: '2023-10-01',
        rentalEndDate: '2023-10-10',
        userId: 123,
        rentalStatus: 'Zakończone',
      },
    }).as('getRentalDetails');

    // Mock błędu przy wystawianiu recenzji
    cy.intercept('POST', 'https://localhost:5001/api/CarRental/review', {
      statusCode: 500,
      body: { message: 'Wystąpił błąd serwera' },
    }).as('submitReview');

    // Wejdź na RentalDetailsPage
    cy.visit('/rentals/1');
    cy.wait(1000);
    cy.wait('@getRentalDetails');

    // Wystaw recenzję
    cy.get('.me-1').first().click(); // Kliknij pierwszą gwiazdkę
    cy.wait(500);
    cy.get('textarea').type('Świetny samochód!');
    cy.wait(500);
    cy.get('button').contains('Wyślij recenzję').click();
    cy.wait(1000);
    cy.wait('@submitReview');

    // Sprawdź komunikat o błędzie
    cy.contains('Wystąpił błąd serwera').should('be.visible');
    cy.wait(1000);
  });
});
