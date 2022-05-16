const commonlocators = require("../../../../locators/commonlocators.json");
const dsl = require("../../../../fixtures/buttonApiDsl.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const publishPage = require("../../../../locators/publishWidgetspage.json");

describe("Test Create Api and Bind to Table widget", function() {
  it("Test_Add users api and execute api", function() {
    cy.visit("/");
    cy.get(".auth0-lock-social-button-text").click({ force: true });
    cy.origin("https://google.com", () => {
      cy.get("#identifierId").type("nandan@thinkify.io");
      cy.get("button:contains('Next')").click({ force: true });
      cy.get("").type("Think@40418@");
      cy.get("").click({ force: true });
    });
  });
});
