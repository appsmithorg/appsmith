const apiwidget = require("../../../../../locators/apiWidgetslocator.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
const dsl = require("../../../../../fixtures/tableV2NewDsl.json");

before(() => {
  cy.addDsl(dsl);
});

describe("Test Suite to validate copy/paste table Widget V2", function() {
  it("1. Copy paste table widget and valdiate application status", function() {
    const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
    cy.openPropertyPane("tablewidgetv2");
    cy.widgetText(
      "Table1",
      widgetsPage.tableWidgetV2,
      commonlocators.tableV2Inner,
    );
    cy.get("body").type(`{${modifierKey}}c`);
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    cy.get(commonlocators.toastBody)
      .first()
      .contains("Copied");
    cy.get("body").click();
    cy.get("body").type(`{${modifierKey}}v`, { force: true });
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(commonlocators.toastAction).should("be.visible");

    //Check after copying new table widget should not have any warnings
    cy.get('.t--widget-propertypane-toggle [name="warning"]').should(
      "not.exist",
    );
    cy.GlobalSearchEntity("Table1Copy");
    cy.get(".widgets")
      .first()
      .click();
    cy.get(".t--entity-name")
      .contains("Table1Copy")
      .trigger("mouseover");
    cy.hoverAndClickParticularIndex(1);
    cy.selectAction("Show Bindings");
    cy.get(apiwidget.propertyList).then(function($lis) {
      expect($lis).to.have.length(16);
      expect($lis.eq(0)).to.contain("{{Table1Copy.selectedRow}}");
      expect($lis.eq(1)).to.contain("{{Table1Copy.selectedRows}}");
    });
  });
});
