const dsl = require("../../../../fixtures/buttondsl.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const debuggerLocators = require("../../../../locators/Debugger.json");

describe("Debugger logs", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  it("Modifying widget properties should log the same", function() {
    cy.openPropertyPane("buttonwidget");
    cy.testJsontext("label", "Test");

    cy.get(".t--debugger").click();
    cy.get(".t--debugger-log-state").contains("Test");
  });

  it("Reset debugger state", function() {
    cy.get(".t--property-control-visible")
      .find(".t--js-toggle")
      .click();
    cy.testJsontext("visible", "Test");

    cy.get(commonlocators.homeIcon).click({ force: true });
    cy.generateUUID().then((id) => {
      cy.CreateAppInFirstListedOrg(id);

      cy.contains(debuggerLocators.debuggerIcon, 0);
    });
  });
});
