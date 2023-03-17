const widgetsPage = require("../../../../../locators/Widgets.json");
const dsl = require("../../../../../fixtures/defaultTableV2Dsl.json");

describe("Table Widget V2 property pane deafult feature validation", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Verify default table row Data", function() {
    // Open property pane
    cy.openPropertyPane("tablewidgetv2");
    // Open Widget side bar
    cy.get(widgetsPage.addWidget).click();
    // Drag and drop table widget
    cy.dragAndDropToCanvas("tablewidgetv2", { x: 200, y: 100 });
    // close Widget side bar
    cy.get(widgetsPage.explorerSwitchId).click({ force: true });
    cy.wait(2000);
    cy.SearchEntityandOpen("Table2");
    // Verify default array data
    cy.wait(2000);
    cy.readTableV2dataFromSpecificIndex("0", "0", 0).then((tabData) => {
      const tabValue = tabData;
      cy.log("the table is" + tabValue);
      cy.get(".bp3-ui-text span")
        .eq(1)
        .should("have.text", tabData);
    });
    cy.SearchEntityandOpen("Table1");
    cy.wait(2000);
    cy.readTableV2dataFromSpecificIndex("2", "0", 1).then((tabData) => {
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
