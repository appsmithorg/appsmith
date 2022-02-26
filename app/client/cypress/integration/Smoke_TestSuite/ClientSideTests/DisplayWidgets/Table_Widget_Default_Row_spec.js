const widgetsPage = require("../../../../locators/Widgets.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/defaultTableDsl.json");
const testdata = require("../../../../fixtures/testdata.json");
const emptyTableColumnNameData = require("../../../../fixtures/TableWidgetDatawithEmptyKeys.json");

describe("Table Widget property pane deafult feature validation", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Verify default table row Data", function() {
    // Open property pane
    cy.openPropertyPane("tablewidget");
    // Open Widget side bar
    cy.get(widgetsPage.addWidget).click();
    // Drag and drop table widget
    cy.dragAndDropToCanvas("tablewidget", { x: 200, y: 100 });
    // close Widget side bar
    cy.get(widgetsPage.explorerSwitchId).click({ force: true });
    cy.wait(2000);
    cy.SearchEntityandOpen("Table2");
    // Verify default array data
    cy.wait(2000);
    cy.readTabledataFromSpecificIndex("0", "0", 0).then((tabData) => {
      const tabValue = tabData;
      cy.log("the table is" + tabValue);
      cy.get(".bp3-ui-text span")
        .eq(1)
        .should("have.text", tabData);
    });
    cy.SearchEntityandOpen("Table1");
    cy.wait(2000);
    cy.readTabledataFromSpecificIndex("2", "0", 1).then((tabData) => {
      const tabValue = tabData;
      cy.log("the table is" + tabValue);
      cy.get(".bp3-ui-text span")
        .eq(0)
        .should("have.text", tabData);
    });
  });

  afterEach(() => {
    // put your clean up code if any
    cy.goToEditFromPublish();
  });
});
