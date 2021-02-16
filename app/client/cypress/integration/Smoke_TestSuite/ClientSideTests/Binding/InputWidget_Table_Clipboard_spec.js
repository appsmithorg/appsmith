const commonlocators = require("../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../locators/FormWidgets.json");
const dsl = require("../../../../fixtures/tableInputDsl.json");
const pages = require("../../../../locators/Pages.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const testdata = require("../../../../fixtures/testdata.json");
const dsl2 = require("../../../../fixtures/displayWidgetDsl.json");
const explorer = require("../../../../locators/explorerlocators.json");

describe("Copy to Clipboard feature validation", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Validation of copy to clipboard functionality with table widget", function() {
    cy.SearchEntityandOpen("Table1");
    cy.get(widgetsPage.tableOnRowSelect).click();
    cy.get(commonlocators.chooseAction)
      .children()
      .contains("Copy to Clipboard")
      .click();
    cy.enterNavigatePageName("Test");
    cy.get(commonlocators.editPropCrossButton).click({ force: true });
  });

  it("Validation of copy to clipboard feature with input widget", function() {
    const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
    cy.isSelectRow(1);
    cy.get(publish.inputGrp)
      .first()
      .click();
    cy.get(publish.inputGrp)
      .first()
      .type(`{${modifierKey}}v`, { force: true });
    cy.get(publish.inputWidget + " " + "input")
      .first()
      .invoke("attr", "value")
      .should("contain", "Test");
  });
});
