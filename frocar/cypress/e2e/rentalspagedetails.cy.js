describe('RentalDetailsPage', () => {
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
      if (loginResponse.status === 200) {
        const token = loginResponse.body.token;
        if (token) {
          cy.setCookie('token', token);
        }
      } else if (loginResponse.status === 400 || loginResponse.status === 401) {
        cy.request({
          method: 'POST',
          url: 'https://localhost:5001/api/Account/register',
          body: {
            Username: 'Kozub',
            Email: 'tytaj04@gmail.com',
            Password: 'Qwerty123!',
          },
          failOnStatusCode: false,
        }).then(registerResponse => {
          if (registerResponse.status === 200) {
            cy.request({
              method: 'POST',
              url: 'https://localhost:5001/api/Account/login',
              body: {
                username: 'Kozub',
                password: 'Qwerty123!',
              },
            }).then(retryLoginResponse => {
              if (retryLoginResponse.status === 200 && retryLoginResponse.body.token) {
                cy.setCookie('token', retryLoginResponse.body.token);
              } else {
                throw new Error('Logowanie nieudane po rejestracji');
              }
            });
          } else {
            throw new Error('Rejestracja użytkownika nieudana');
          }
        });
      } else {
        throw new Error('Nieoczekiwany błąd podczas logowania');
      }
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
    cy.clearCookies();
    loginUser();
    cy.getCookie('token').should('exist');
  });

  it('should render rental details correctly for a logged-in user', () => {
    cy.intercept('GET', 'https://localhost:5001/api/CarRental/1', {
      statusCode: 200,
      body: {
        carRentalId: 1,
        carListing: {
          id: 101,
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

    cy.visit('/rentals/1');
    cy.wait('@getRentalDetails');

    cy.get('h2').should('contain', 'Szczegóły wypożyczenia');
    cy.contains('Toyota (sedan)').should('be.visible');
    cy.contains('Czas trwania: 9 dni').should('be.visible');
    cy.contains('Status: Aktywne').should('be.visible');
    cy.contains('Całkowity koszt: 900 zł').should('be.visible');
    cy.contains('Pojemność silnika: 2L').should('be.visible');
    cy.contains('Dodatki: Klimatyzacja, GPS').should('be.visible');
    cy.get('button').contains('Anuluj wypożyczenie').should('be.visible');
  });

  it('should display an error message when fetching rental details fails', () => {
    cy.intercept('GET', 'https://localhost:5001/api/CarRental/1', {
      statusCode: 500,
      body: { message: 'Wystąpił problem po stronie serwera. Spróbuj ponownie później.' },
    }).as('getRentalDetailsError');

    cy.visit('/rentals/1');
    cy.wait('@getRentalDetailsError');

    cy.contains('Wystąpił problem po stronie serwera. Spróbuj ponownie później.').should('be.visible');
    cy.get('button').contains('Wróć').should('be.visible');
  });

  it('should cancel a rental', () => {
    cy.intercept('GET', 'https://localhost:5001/api/CarRental/1', {
      statusCode: 200,
      body: {
        carRentalId: 1,
        carListing: {
          id: 101,
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
    }).as('getRentalDetailsForCancel');

    cy.intercept('DELETE', 'https://localhost:5001/api/CarRental/1', {
      statusCode: 200,
      body: { message: 'Wypożyczenie zostało anulowane' },
    }).as('cancelRental');

    cy.visit('/rentals/1');
    cy.wait('@getRentalDetailsForCancel');

    cy.get('button').contains('Anuluj wypożyczenie').click();
    cy.wait('@cancelRental');

    cy.contains('Wypożyczenie zostało anulowane.').should('be.visible');
  });

  describe('Review Tests', () => {
    beforeEach(() => {
      cy.intercept('GET', 'https://localhost:5001/api/CarRental/1', {
        statusCode: 200,
        body: {
          carRentalId: 1,
          carListing: {
            id: 101,
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
      }).as('getCompletedRental');

      cy.intercept('GET', 'https://localhost:5001/api/CarRental/reviews/101', {
        statusCode: 200,
        body: [],
      }).as('getEmptyReviews');
    });

    it('should submit a review for a completed rental', () => {
      cy.visit('/rentals/1');
      cy.wait(['@getCompletedRental', '@getEmptyReviews']);

      cy.contains('Wystaw recenzję').should('be.visible');
      cy.wait(1000);

      cy.get('.mb-3 svg').then(($stars) => {
        console.log('Found stars:', $stars.length);
        $stars.each((index, star) => {
          console.log(`Star ${index}:`, star);
        });
      });


      cy.get('.mb-3 svg').eq(4).should('be.visible').click({ force: true });


      cy.get('.mb-3 svg').eq(4).should('have.css', 'color', 'rgb(255, 193, 7)');

      cy.get('textarea').type('Świetny samochód!');

      cy.intercept('POST', 'https://localhost:5001/api/CarRental/review', {
        statusCode: 200,
        body: { message: 'Recenzja została dodana pomyślnie!' },
      }).as('submitReview');


      cy.get('button').contains('Wyślij recenzję').click();
      cy.wait('@submitReview');
      
    
    });

    it('should display an error message when submitting a review fails', () => {
      cy.visit('/rentals/1');
      cy.wait(['@getCompletedRental', '@getEmptyReviews']);

      cy.get('.mb-3 svg').eq(4).click({ force: true });
      cy.get('textarea').type('Świetny samochód!');

      cy.intercept('POST', 'https://localhost:5001/api/CarRental/review', {
        statusCode: 500,
        body: { message: 'Wystąpił problem po stronie serwera. Spróbuj ponownie później.' },
      }).as('submitReviewError');

      cy.get('button').contains('Wyślij recenzję').click();
      cy.wait('@submitReviewError');

      cy.contains('Wystąpił problem po stronie serwera. Spróbuj ponownie później.').should('be.visible');
    });

    it('should display a message if a review already exists', () => {
      cy.intercept('GET', 'https://localhost:5001/api/CarRental/reviews/101', {
        statusCode: 200,
        body: [{
          carRental: { carRentalId: 1 },
          rating: 5,
          comment: 'Świetny samochód!'
        }],
      }).as('getExistingReview');

      cy.visit('/rentals/1');
      cy.wait(['@getCompletedRental', '@getExistingReview']);

      cy.contains('Recenzja dla tego wypożyczenia została już wystawiona.').should('be.visible');
    });
  });
});
