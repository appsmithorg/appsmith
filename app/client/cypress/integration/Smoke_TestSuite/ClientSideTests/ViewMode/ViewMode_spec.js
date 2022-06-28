const dsl = require("../../../../fixtures/previewMode.json");

const BASE_URL = Cypress.config().baseUrl;

describe("Preview mode functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("on click of apps on header, it should take to application home page", function() {
    cy.PublishtheApp();

    cy.get(".t--back-to-home").click();
    cy.url().should("eq", BASE_URL + "applications");
  });
});
