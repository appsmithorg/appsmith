const dsl = require("../../../../fixtures/buttonGroupDsl.json");
const commonlocators = require("../../../../locators/commonlocators.json");

describe("Widget Grouping", function () {
  before(() => {
    cy.addDsl(dsl);
  });
  it("Button widgets widget on click info message valdiation ", function () {
    cy.get(".t--buttongroup-widget button")
      .contains("Add")
      .click({ force: true });
    cy.get(".t--buttongroup-widget button")
      .contains("More")
      .click({ force: true });
    cy.get(commonlocators.toastmsg).should(
        "have.css",
        "font-family",
        "14px",).contains("test alert");
    /*  
    cy.get(commonlocators.toastmsg).should(
      "have.css",
      "font-size",
      "14px",).contains("test alert");
      */
    cy.PublishtheApp();
    cy.get(".t--buttongroup-widget button")
      .contains("Add")
      .click({ force: true });
    cy.get(".t--buttongroup-widget button")
      .contains("More")
      .click({ force: true });
    cy.get(commonlocators.toastmsg).contains("test alert");
    cy.goToEditFromPublish();
  });
});
