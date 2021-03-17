const homePage = require("../../../../locators/HomePage.json");

describe("Update a user's name", function() {
  let username;

  it("Update a user's name", function() {
    cy.get(homePage.profileMenu).click();
    cy.get(".t--edit-profile").click();

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
});
