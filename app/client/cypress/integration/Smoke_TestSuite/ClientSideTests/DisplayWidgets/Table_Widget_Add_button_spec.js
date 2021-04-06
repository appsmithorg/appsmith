const widgetsPage = require("../../../../locators/Widgets.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/tableNewDsl.json");
const pages = require("../../../../locators/Pages.json");
const testdata = require("../../../../fixtures/testdata.json");

describe("Table Widget property pane feature validation", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Table widget with Add button test and validation", function() {
    cy.openPropertyPane("tablewidget");
    cy.editColumn("id");
    cy.get(widgetsPage.tableBtn).should("not.exist");
    cy.changeColumnType("Button");
    cy.updateComputedValue(testdata.currentRowOrderAmt);
    cy.get(widgetsPage.actionSelect).click();
    cy.get(commonlocators.chooseAction)
      .children()
      .contains("Show Message")
      .click();
    cy.addSuccessMessage("Successful ".concat(testdata.currentRowEmail));
    cy.get(commonlocators.editPropCrossButton).click({ force: true });
    cy.get(widgetsPage.tableBtn)
      .last()
      .click({ force: true });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(3000);
    cy.get(widgetsPage.toastAction).should("be.visible");
    cy.get(widgetsPage.toastActionText)
      .last()
      .invoke("text")
      .then((text) => {
        const someText = text;
        expect(someText).to.equal("Successful tobias.funke@reqres.in");
      });
  });
});
