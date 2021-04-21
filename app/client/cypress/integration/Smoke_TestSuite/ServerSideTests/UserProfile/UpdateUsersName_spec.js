const homePage = require("../../../../locators/HomePage.json");

describe("Update a user's name", function() {
  let username;

  it("Update a user's name", function() {
    cy.get(homePage.profileMenu).click();
    cy.get(".t--edit-profile").click({ force: true });

    cy.generateUUID().then((uid) => {
      username = uid;
      cy.get("[data-cy=t--display-name]").clear();
      cy.get("[data-cy=t--display-name]").type(username);
      // Waiting as the input onchange has a debounce
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(2000);
      cy.get(".t--back").click();
      cy.reload();
      cy.get(homePage.profileMenu).click();
      cy.get(".t--user-name").contains(username);
    });
  });

  it("Validate email address and Reset pwd", function() {
    cy.intercept("POST", "/api/v1/users/forgotPassword", {
      fixture: "resetPassword.json",
    }).as("resetPwd");
    cy.get(".t--edit-profile").click({ force: true });

    // Waiting as the input onchange has a debounce
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);
    cy.get(".react-tabs .cs-text")
      .last()
      .invoke("text")
      .then((text) => {
        const someText = text;
        expect(someText).to.equal(Cypress.env("USERNAME"));
      });
    cy.get(".react-tabs a")
      .last()
      .contains("Reset Password")
      .click();
    cy.wait("@resetPwd").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });
});
