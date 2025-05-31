describe('RegisterPage', () => {
  beforeEach(() => {
    cy.visit('/register');
  });

  it('Powinien wyświetlić formularz rejestracji', () => {
    cy.get('h2').should('have.text', 'Rejestracja');
    cy.get('form').should('exist');
    cy.get('label').should('have.length', 4);
    cy.get('label').eq(0).should('have.text', 'Nazwa użytkownika');
    cy.get('label').eq(1).should('have.text', 'Email');
    cy.get('label').eq(2).should('have.text', 'Hasło');
    cy.get('label').eq(3).should('have.text', 'Potwierdź hasło');
    cy.get('input[name="username"]').should('exist').and('have.attr', 'placeholder', 'Wpisz nazwę użytkownika');
    cy.get('input[name="email"]').should('exist').and('have.attr', 'placeholder', 'Wpisz email');
    cy.get('input[name="password"]').should('exist').and('have.attr', 'placeholder', 'Wpisz hasło');
    cy.get('input[name="confirmPassword"]').should('exist').and('have.attr', 'placeholder', 'Powtórz hasło');
    cy.get('button[type="submit"]').should('exist').and('have.text', 'Zarejestruj się');
  });

  it('Powinien wyświetlić błędy walidacji dla pustego formularza', () => {
    cy.get('button[type="submit"]').click();
    cy.get('.text-danger').should('have.length.at.least', 1);
    cy.get('.text-danger').eq(0).should('have.text', 'Nazwa użytkownika jest wymagana');
  });

  it('Powinien wyświetlić błędy walidacji dla niepoprawnych danych', () => {
    cy.get('input[name="username"]').type('ab');
    cy.get('input[name="email"]').type('invalid');
    cy.get('input[name="password"]').type('pass');
    cy.get('input[name="confirmPassword"]').type('different');
    cy.get('button[type="submit"]').click();
    cy.get('.text-danger').should('have.length.at.least', 1);
    cy.get('.text-danger').eq(0).should('have.text', 'Nazwa użytkownika musi mieć co najmniej 3 znaki');
  });

  it('Powinien zarejestrować użytkownika przy poprawnych danych i przekierować do logowania', () => {
    cy.intercept('POST', 'https://localhost:5001/api/account/register', {
      statusCode: 200,
      body: { message: 'Registration successful' },
    }).as('register');

    cy.get('input[name="username"]').type('testuser');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('Password123!');
    cy.get('input[name="confirmPassword"]').type('Password123!');
    cy.get('button[type="submit"]').click();

    cy.wait('@register');
    cy.url().should('include', '/Login');
  });

  it('Powinien wyświetlić błąd serwera dla zajętej nazwy użytkownika', () => {
    cy.intercept('POST', 'https://localhost:5001/api/account/register', {
      statusCode: 400,
      body: { message: 'Username is already taken' },
    }).as('registerError');

    cy.get('input[name="username"]').type('testuser');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('Password123!');
    cy.get('input[name="confirmPassword"]').type('Password123!');
    cy.get('button[type="submit"]').click();

    cy.wait('@registerError');
    cy.get('.alert').should('have.text', 'Nazwa użytkownika jest już zajęta.');
  });

  it('Powinien wyświetlić błąd serwera dla zajętego emaila', () => {
    cy.intercept('POST', 'https://localhost:5001/api/account/register', {
      statusCode: 400,
      body: { message: 'Email is already in use' },
    }).as('registerError');

    cy.get('input[name="username"]').type('testuser');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('Password123!');
    cy.get('input[name="confirmPassword"]').type('Password123!');
    cy.get('button[type="submit"]').click();

    cy.wait('@registerError');
    cy.get('.alert').should('have.text', 'Podany adres email jest już używany.');
  });
});
