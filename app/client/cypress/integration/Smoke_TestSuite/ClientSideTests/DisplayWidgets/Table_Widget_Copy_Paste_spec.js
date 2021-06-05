const testdata = require("../../../../fixtures/testdata.json");
const apiwidget = require("../../../../locators/apiWidgetslocator.json");
const explorer = require("../../../../locators/explorerlocators.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../locators/FormWidgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const dsl = require("../../../../fixtures/tableNewDsl.json");

const pageid = "MyPage";
before(() => {
  cy.addDsl(dsl);
});

describe("Test Suite to validate copy/paste table Widget", function() {
  it("Copy paste table widget and valdiate application status", function() {
    const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";

    cy.openPropertyPane("tablewidget");
    cy.widgetText("Table1", widgetsPage.tableWidget, commonlocators.tableInner);
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
    /*
    cy.get(commonlocators.toastAction)
      .contains("UNDO")
      .click({ force: true });
    */
    cy.GlobalSearchEntity("Table1Copy");
    cy.get(".t--entity-collapse-toggle")
      .last()
      .click();
    cy.get(apiwidget.propertyList).then(function($lis) {
      expect($lis).to.have.length(10);
      expect($lis.eq(0)).to.contain("{{Table1Copy.selectedRow}}");
      expect($lis.eq(1)).to.contain("{{Table1Copy.selectedRows}}");
    });
  });
});
