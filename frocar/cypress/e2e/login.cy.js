describe('Testy logowania', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('Powinien wyświetlić formularz logowania', () => {
    cy.get('h2').should('contain', 'Logowanie');
    cy.get('input[name="username"]').should('exist');
    cy.get('input[name="password"]').should('exist');
    cy.get('button[type="submit"]').should('exist');
  });

  it('Powinien wyświetlić błąd przy pustych polach', () => {
    cy.get('button[type="submit"]').click();
    cy.get('.alert').should('contain', 'Nazwa użytkownika i hasło są wymagane');
  });

  it('Powinien wyświetlić błąd przy niepoprawnych danych', () => {
    cy.intercept('POST', '/api/account/login', {
      statusCode: 401,
      body: { message: 'Niepoprawne dane logowania' },
    }).as('loginRequest');

    cy.get('input[name="username"]').type('zlyuser');
    cy.get('input[name="password"]').type('zlehaslo');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginRequest');
    cy.get('.alert').should('contain', 'Niepoprawne dane logowania');
  });

  it('Powinien zalogować użytkownika przy poprawnych danych', () => {
    cy.intercept('POST', '/api/account/login', {
      statusCode: 200,
      body: { token: 'testowy-token' },
    }).as('loginRequest');

    cy.get('input[name="username"]').type('test');
    cy.get('input[name="password"]').type('Qwerty123!');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginRequest');
    cy.url().should('eq', 'http://localhost:5173/');
  });
});