const apiwidget = require("../../../../locators/apiWidgetslocator.json");
const commonlocators = require("../../../../locators/commonlocators.json");
import {
  agHelper,
  entityExplorer,
  propPane,
} from "../../../../support/Objects/ObjectsCore";

before(() => {
  agHelper.AddDsl("formWithInputdsl");
});

describe("Test Suite to validate copy/delete/undo functionalites", function () {
  it("1. Drag and drop form widget and validate copy widget via toast message", function () {
    const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
    entityExplorer.SelectEntityByName("Form1", "Widgets");
    propPane.RenameWidget("Form1", "FormTest");
    entityExplorer.SelectEntityByName("FormTest", "Widgets");
    cy.get("body").type(`{${modifierKey}}c`);
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    cy.get(commonlocators.toastBody)
      .first()
      .contains("Copied FormTest")
      .click();
    cy.get("body").type(`{${modifierKey}}v`, { force: true });
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.wait(1000);
    entityExplorer.ExpandCollapseEntity("FormTest");
    entityExplorer.SelectEntityByName("FormTestCopy");
    cy.get("body").type("{del}", { force: true });
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    agHelper.Sleep();
    cy.get("body").type(`{${modifierKey}}z`, { force: true });
    entityExplorer.ExpandCollapseEntity("Widgets");
    entityExplorer.ExpandCollapseEntity("FormTest");
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "FormTestCopy",
      action: "Show bindings",
    });
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
    agHelper.RemoveUIElement("Toast", "7 widgets are added back.");
  });
});
