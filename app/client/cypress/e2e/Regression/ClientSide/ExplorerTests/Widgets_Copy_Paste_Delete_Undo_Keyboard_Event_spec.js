const apiwidget = require("../../../../locators/apiWidgetslocator.json");
const commonlocators = require("../../../../locators/commonlocators.json");
import * as _ from "../../../../support/Objects/ObjectsCore";

before(() => {
  cy.fixture("formWithInputdsl").then((val) => {
    _.agHelper.AddDsl(val);
  });
});

describe("Test Suite to validate copy/delete/undo functionalites", function () {
  it("1. Drag and drop form widget and validate copy widget via toast message", function () {
    const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
    _.entityExplorer.SelectEntityByName("Form1", "Widgets");
    _.propPane.RenameWidget("Form1", "FormTest");
    cy.get("body").click();
    cy.get("body").type(`{${modifierKey}}c`);
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    cy.get(commonlocators.toastBody).first().contains("Copied").click();
    cy.get("body").type(`{${modifierKey}}v`, { force: true });
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.wait(1000);
    _.entityExplorer.ExpandCollapseEntity("FormTest");
    _.entityExplorer.SelectEntityByName("FormTestCopy");
    cy.get("body").type("{del}", { force: true });
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    _.agHelper.Sleep();
    cy.get("body").type(`{${modifierKey}}z`, { force: true });
    _.entityExplorer.ExpandCollapseEntity("Widgets");
    _.entityExplorer.ExpandCollapseEntity("FormTest");
    _.entityExplorer.ActionContextMenuByEntityName(
      "FormTestCopy",
      "Show bindings",
    );
    cy.get(apiwidget.propertyList).then(function ($lis) {
      expect($lis).to.have.length(3);
      expect($lis.eq(0)).to.contain("{{FormTestCopy.isVisible}}");
      expect($lis.eq(1)).to.contain("{{FormTestCopy.data}}");
      expect($lis.eq(2)).to.contain("{{FormTestCopy.hasChanges}}");
      cy.contains("FormTestCopy");
      cy.get($lis.eq(1))
        .contains("{{FormTestCopy.data}}")
        .click({ force: true });
      cy.get(".bp3-input").first().click({ force: true });
      cy.get(".bp3-input").first().type(`{${modifierKey}}v`, { force: true });
    });
  });
});
