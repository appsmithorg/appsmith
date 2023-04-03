const apiwidget = require("../../../../locators/apiWidgetslocator.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../locators/FormWidgets.json");
const dsl = require("../../../../fixtures/formWithInputdsl.json");
const widgetsPage = require("../../../../locators/Widgets.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";
let ee = ObjectsRegistry.EntityExplorer,
  agHelper = ObjectsRegistry.AggregateHelper;

before(() => {
  cy.addDsl(dsl);
});

describe("Test Suite to validate copy/delete/undo functionalites", function () {
  it.only("Drag and drop form widget and validate copy widget via toast message", function () {
    const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";

    cy.openPropertyPane("formwidget");
    cy.widgetText(
      "FormTest",
      formWidgetsPage.formWidget,
      widgetsPage.widgetNameSpan,
    );
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
    cy.get("body").type("{del}", { force: true });
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    agHelper.Sleep(1000);
    cy.get("body").type(`{${modifierKey}}z`, { force: true });
    ee.ExpandCollapseEntity("Widgets");
    ee.ExpandCollapseEntity("FormTest");
    ee.ActionContextMenuByEntityName("FormTestCopy", "Show Bindings");
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
