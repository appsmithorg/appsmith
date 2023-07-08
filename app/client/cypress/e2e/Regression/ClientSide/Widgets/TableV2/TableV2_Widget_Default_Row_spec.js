const widgetsPage = require("../../../../../locators/Widgets.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe("Table Widget V2 property pane deafult feature validation", function () {
  before(() => {
    _.agHelper.AddDsl("defaultTableV2Dsl");
  });

  it("1. Verify default table row Data", function () {
    // Open property pane
    cy.openPropertyPane("tablewidgetv2");
    // Open Widget side bar
    cy.get(widgetsPage.addWidget).click();
    // Drag and drop table widget
    cy.dragAndDropToCanvas("tablewidgetv2", { x: 200, y: 100 });
    _.table.AddSampleTableData();
    // close Widget side bar
    _.entityExplorer.NavigateToSwitcher("Explorer");
    cy.wait(2000);
    _.entityExplorer.SelectEntityByName("Table2");

    // Verify default array data
    cy.wait(2000);
    cy.readTableV2dataFromSpecificIndex("0", "0", 0).then((tabData) => {
      const tabValue = tabData;
      cy.log("the table is" + tabValue);
      cy.get(".bp3-ui-text span").eq(1).should("have.text", tabData);
    });
    _.entityExplorer.SelectEntityByName("Table1");
    cy.wait(2000);
    cy.readTableV2dataFromSpecificIndex("2", "0", 1).then((tabData) => {
      const tabValue = tabData;
      cy.log("the table is" + tabValue);
      cy.get(".bp3-ui-text span").eq(0).should("have.text", tabData);
    });
  });
});
