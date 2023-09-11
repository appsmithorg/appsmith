const widgetsPage = require("../../../../../locators/Widgets.json");
import {
  agHelper,
  draggableWidgets,
  entityExplorer,
  table,
} from "../../../../../support/Objects/ObjectsCore";

describe("Table Widget V2 property pane deafult feature validation", function () {
  before(() => {
    agHelper.AddDsl("defaultTableV2Dsl");
  });

  it("1. Verify default table row Data", function () {
    entityExplorer.DragNDropWidget(draggableWidgets.TABLE);
    table.AddSampleTableData();
    entityExplorer.SelectEntityByName("Table2");

    // Verify default array data
    cy.readTableV2dataFromSpecificIndex("0", "0", 0).then((tabData) => {
      const tabValue = tabData;
      cy.log("the table is" + tabValue);
      cy.get(".bp3-ui-text span").eq(1).should("have.text", tabData);
    });
    entityExplorer.SelectEntityByName("Table1");
    cy.readTableV2dataFromSpecificIndex("2", "0", 1).then((tabData) => {
      const tabValue = tabData;
      cy.log("the table is" + tabValue);
      cy.get(".bp3-ui-text span").eq(0).should("have.text", tabData);
    });
  });
});
