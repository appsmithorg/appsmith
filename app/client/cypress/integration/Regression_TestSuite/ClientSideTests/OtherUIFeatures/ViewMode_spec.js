const dsl = require("../../../../fixtures/previewMode.json");

const BASE_URL = Cypress.config().baseUrl;

describe("Preview mode functionality", function () {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. on click of apps on header, it should take to application home page", function () {
    cy.PublishtheApp();
    cy.get(".t--app-viewer-back-to-apps-button").click();
    cy.url().should("eq", BASE_URL + "applications");
  });
});
