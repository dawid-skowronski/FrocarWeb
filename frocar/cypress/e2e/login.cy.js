describe('LoginPage', () => {
  // Obsługa nieoczekiwanych wyjątków
  Cypress.on('uncaught:exception', (err, runnable) => {
    console.error('Nieoczekiwany wyjątek:', err.message);
    return false; // Zapobiega przerwaniu testów
  });

  beforeEach(() => {
    // Mock endpointu logowania przed każdym testem
    cy.intercept('POST', 'https://localhost:5001/api/Account/login', {
      statusCode: 200,
      body: { message: 'Logowanie udane', token: 'mock-jwt-token' },
    }).as('login');

    // Odwiedzanie strony logowania z opóźnieniem
    cy.wait(2000); // Czekaj 2 sekundy na uruchomienie serwera
    cy.visit('/login');
  });

  it('powinno poprawnie renderować formularz logowania', () => {
    cy.get('h2').should('have.text', 'Logowanie');
    cy.get('input[name="username"]').should('be.visible').and('have.attr', 'placeholder', 'Wpisz nazwę użytkownika');
    cy.get('input[name="password"]').should('be.visible').and('have.attr', 'placeholder', 'Wpisz hasło');
    cy.get('input#rememberMe').should('be.visible').and('not.be.checked');
    cy.get('label[for="rememberMe"]').should('have.text', 'Zapamiętaj mnie');
    cy.get('button[type="submit"]').should('be.visible').and('have.text', 'Zaloguj się');
  });

  it('powinno wyświetlać błąd, gdy pola są puste', () => {
    cy.get('button[type="submit"]').click();
    cy.get('.alert').should('be.visible').and('contain', 'Nazwa użytkownika i hasło są wymagane.');
  });

  it('powinno pomyślnie zalogować użytkownika i przekierować na stronę główną', () => {
    cy.get('input[name="username"]').type('Kozub');
    cy.get('input[name="password"]').type('Qwerty123!');
    cy.get('input#rememberMe').check();
    cy.get('button[type="submit"]').click();

    // Oczekiwanie na żądanie logowania
    cy.wait('@login').its('request.body').should('deep.equal', {
      username: 'Kozub',
      password: 'Qwerty123!',
    });

    // Sprawdzenie przekierowania
    cy.url({ timeout: 10000 }).should('eq', 'http://localhost:5173/');
  });

  it('powinno wyświetlać błąd, gdy logowanie się nie powiedzie', () => {
    // Mock nieudanego logowania
    cy.intercept('POST', 'https://localhost:5001/api/Account/login', {
      statusCode: 401,
      body: { message: 'Niepoprawne dane logowania.' },
    }).as('loginFail');

    cy.get('input[name="username"]').type('Kozub');
    cy.get('input[name="password"]').type('ZłeHasło');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginFail');
    cy.get('.alert').should('be.visible').and('contain', 'Niepoprawne dane logowania.');
  });

  it('powinno wyświetlać błąd połączenia z serwerem', () => {
    // Mock błędu sieciowego
    cy.intercept('POST', 'https://localhost:5001/api/Account/login', {
      forceNetworkError: true,
    }).as('loginError');

    cy.get('input[name="username"]').type('Kozub');
    cy.get('input[name="password"]').type('Qwerty123!');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginError');
    cy.get('.alert').should('be.visible').and('contain', 'Błąd połączenia z serwerem.');
  });

  it('powinno zmieniać stan "Zapamiętaj mnie"', () => {
    cy.get('input#rememberMe').should('not.be.checked');
    cy.get('input#rememberMe').check();
    cy.get('input#rememberMe').should('be.checked');
    cy.get('input#rememberMe').uncheck();
    cy.get('input#rememberMe').should('not.be.checked');
  });
});