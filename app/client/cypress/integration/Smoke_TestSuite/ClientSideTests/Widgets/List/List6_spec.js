const dsl = require("../../../../../fixtures/ListVulnerabilityDSL.json");
const commonlocators = require("../../../../../locators/commonlocators.json");

describe("Binding the list widget with text widget", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Validate that list widget doesn't execute code", function() {
    cy.PublishtheApp();
    cy.wait(5000);
    cy.get(".t--widget-inputwidgetv2 input")
      .eq(1)
      .type("'+(function() { while(true) {} })()+'", {
        parseSpecialCharSequences: false,
      });
    cy.wait(1000);
    cy.get(".t--widget-buttonwidget")
      .eq(0)
      .click();
    cy.get(commonlocators.toastmsg).contains(
      "'+(function() { while(true) {} })()+'",
    );
  });
});
