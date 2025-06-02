describe('LoginPage', () => {
  beforeEach(() => {
    cy.intercept('POST', 'https://localhost:5001/api/account/login', (req) => {
      if (req.body.username === 'validUser' && req.body.password === 'validPass') {
        req.reply({
          statusCode: 200,
          body: { token: 'fake-jwt-token' }
        });
      } else if (req.body.username === 'lockedUser') {
        req.reply({
          statusCode: 403,
          body: { message: 'Konto jest zablokowane' }
        });
      } else {
        req.reply({
          statusCode: 401,
          body: { message: 'Niepoprawne dane logowania' }
        });
      }
    }).as('loginRequest');

    cy.visit('/login');
  });

  it('powinien wyświetlać formularz logowania', () => {
    cy.get('h2').should('contain', 'Logowanie');
    cy.get('input[name="username"]').should('exist');
    cy.get('input[name="password"]').should('exist');
    cy.get('button[type="submit"]').should('contain', 'Zaloguj się');
    cy.get('a').contains('Zapomniałeś hasła?').should('exist');
  });

  it('powinien wyświetlać błąd przy pustym formularzu', () => {
    cy.get('button[type="submit"]').click();
    cy.get('.alert').should('contain', 'Nazwa użytkownika i hasło są wymagane.');
  });

  it('powinien wyświetlać błąd przy niepoprawnych danych', () => {
    cy.get('input[name="username"]').type('invalidUser');
    cy.get('input[name="password"]').type('wrongPass');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginRequest');
    cy.get('.alert').should('contain', 'Niepoprawne dane logowania');
  });

  it('powinien zalogować się przy poprawnych danych', () => {
    cy.get('input[name="username"]').type('validUser');
    cy.get('input[name="password"]').type('validPass');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginRequest');
    cy.url().should('include', '/');
  });

  it('powinien wyświetlać specjalny błąd dla zablokowanego konta', () => {
    cy.get('input[name="username"]').type('lockedUser');
    cy.get('input[name="password"]').type('anyPass');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginRequest');
    cy.get('.alert').should('contain', 'Konto jest zablokowane');
  });

  it('powinien przekierować do strony resetu hasła', () => {
    cy.get('a').contains('Zapomniałeś hasła?').click();
    cy.url().should('include', '/request-password-reset');
  });

  it('powinien wyłączyć przycisk podczas ładowania', () => {
    cy.intercept('POST', 'https://localhost:5001/api/account/login', {
      delay: 1000,
      statusCode: 200,
      body: { token: 'fake-jwt-token' }
    }).as('slowLogin');

    cy.get('input[name="username"]').type('validUser');
    cy.get('input[name="password"]').type('validPass');
    cy.get('button[type="submit"]').click();

    cy.get('button[type="submit"]').should('be.disabled');
    cy.get('button[type="submit"]').should('contain', 'Logowanie...');
  });

  it('powinien wyświetlać odpowiednie style dla różnych motywów', () => {
    cy.get('.card').should('have.css', 'background-color');
  });
});