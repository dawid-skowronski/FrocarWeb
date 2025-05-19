describe('Testy rejestracji użytkownika', () => {
  beforeEach(() => {
    cy.visit('/register', { timeout: 10000 });
  });

  it('Powinien wyświetlić formularz rejestracji', () => {
    cy.get('h2').should('contain', 'Rejestracja');
    cy.get('input[name="username"]').should('exist');
    cy.get('input[name="email"]').should('exist');
    cy.get('input[name="password"]').should('exist');
    cy.get('input[name="confirmPassword"]').should('exist');
    cy.get('button[type="submit"]').should('contain', 'Zarejestruj się');
  });

  it('Powinien wyświetlić błędy walidacji dla pustego formularza', () => {
    cy.get('button[type="submit"]').click();
    
    cy.contains('Nazwa użytkownika jest wymagana').should('be.visible');
    cy.contains('Email jest wymagany').should('be.visible');
    cy.contains('Hasło jest wymagane').should('be.visible');
    cy.contains('Potwierdzenie hasła jest wymagane').should('be.visible');
  });

  it('Powinien wyświetlić błędy dla niepoprawnych danych', () => {
    // Zbyt krótka nazwa użytkownika
    cy.get('input[name="username"]').type('ab');
    cy.contains('Nazwa użytkownika musi mieć co najmniej 3 znaki').should('be.visible');

    // Niepoprawny email
    cy.get('input[name="email"]').type('niepoprawnyemail');
    cy.contains('Podaj poprawny adres email').should('be.visible');

    // Słabe hasło
    cy.get('input[name="password"]').type('slabehaslo');
    cy.contains('Hasło musi zawierać co najmniej jedną wielką literę').should('be.visible');
    cy.contains('Hasło musi zawierać co najmniej jedną cyfrę').should('be.visible');
    cy.contains('Hasło musi zawierać co najmniej jeden znak specjalny').should('be.visible');

    // Niepasujące hasła
    cy.get('input[name="password"]').clear().type('SilneHasło123!');
    cy.get('input[name="confirmPassword"]').type('innehaslo');
    cy.contains('Hasła muszą być identyczne').should('be.visible');
  });

  it('Powinien wyświetlić błąd gdy nazwa użytkownika jest zajęta', () => {
    // Mockujemy odpowiedź serwera
    cy.intercept('POST', '/api/account/register', {
      statusCode: 400,
      body: { message: 'Username is already taken' }
    }).as('registerRequest');

    // Wypełniamy formularz poprawnymi danymi
    cy.get('input[name="username"]').type('istniejacyuser');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('SilneHasło123!');
    cy.get('input[name="confirmPassword"]').type('SilneHasło123!');
    cy.get('button[type="submit"]').click();

    // Sprawdzamy komunikat błędu
    cy.wait('@registerRequest');
    cy.contains('Nazwa użytkownika jest już zajęta').should('be.visible');
  });

  it('Powinien poprawnie zarejestrować użytkownika', () => {
    // Mockujemy sukces rejestracji
    cy.intercept('POST', '/api/account/register', {
      statusCode: 200,
      body: { message: 'User registered successfully' }
    }).as('registerRequest');

    // Wypełniamy formularz
    const timestamp = Date.now();
    const testUser = `testuser_${timestamp}`;
    const testEmail = `test_${timestamp}@example.com`;
    
    cy.get('input[name="username"]').type(testUser);
    cy.get('input[name="email"]').type(testEmail);
    cy.get('input[name="password"]').type('SilneHasło123!');
    cy.get('input[name="confirmPassword"]').type('SilneHasło123!');
    cy.get('button[type="submit"]').click();

    // Sprawdzamy przekierowanie i odpowiedź
    cy.wait('@registerRequest');
    cy.url().should('include', '/Login');
  });

  it('Powinien wyświetlić komunikat o błędzie serwera', () => {
    // Mockujemy błąd serwera
    cy.intercept('POST', '/api/account/register', {
      statusCode: 500,
      body: { message: 'Internal server error' }
    }).as('registerRequest');

    // Wypełniamy formularz
    cy.get('input[name="username"]').type('testuser');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('SilneHasło123!');
    cy.get('input[name="confirmPassword"]').type('SilneHasło123!');
    cy.get('button[type="submit"]').click();

    // Sprawdzamy komunikat błędu
    cy.wait('@registerRequest');
    cy.contains('Wystąpił błąd podczas rejestracji').should('be.visible');
  });
});