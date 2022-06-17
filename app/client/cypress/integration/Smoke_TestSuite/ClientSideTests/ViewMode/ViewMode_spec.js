const dsl = require("../../../../fixtures/previewMode.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const publishPage = require("../../../../locators/publishWidgetspage.json");

describe("Preview mode functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("on click of apps on header, it should take to application home page", function() {
    cy.PublishtheApp();

    cy.get(".t--back-to-home").click();
    cy.url().should("eq", Cypress.config().baseUrl + "applications");
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
