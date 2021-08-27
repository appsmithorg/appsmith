const commonlocators = require("../../../../locators/commonlocators.json");
const widgetLocators = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/replay.json");

describe("Undo/Redo functionality", function() {
  const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";

  before(() => {
    cy.addDsl(dsl);
  });

  it("checks undo/redo for toggle control in property pane", function() {
    cy.openPropertyPane("checkboxwidget");
    cy.CheckWidgetProperties(commonlocators.disableCheckbox);

    cy.get("body").type(`{${modifierKey}}z`);
    cy.wait(100);
    cy.get(".t--property-control-disabled label").should(
      "not.have.class",
      "checked",
    );
    cy.get(widgetLocators.checkboxWidget + " " + "input").should(
      "not.be.disabled",
    );

    cy.get("body").type(`{${modifierKey}}{shift}z`);
    cy.wait(100);
    cy.get(".t--property-control-disabled label").should(
      "have.class",
      "checked",
    );
    cy.get(widgetLocators.checkboxWidget + " " + "input").should("be.disabled");
  });
});
