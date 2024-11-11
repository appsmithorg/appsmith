import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";
import {
  agHelper,
  draggableWidgets,
  entityExplorer,
  table,
} from "../../../../../support/Objects/ObjectsCore";

describe(
  "Table Widget V2 property pane deafult feature validation",
  { tags: ["@tag.Widget", "@tag.Table", "@tag.Binding"] },
  function () {
    before(() => {
      agHelper.AddDsl("defaultTableV2Dsl");
    });

    it("1. Verify default table row Data", function () {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TABLE);
      table.AddSampleTableData();
      EditorNavigation.SelectEntityByName("Table2", EntityType.Widget);

      // Verify default array data
      cy.readTableV2dataFromSpecificIndex("0", "0", 0).then((tabData) => {
        const tabValue = tabData;
        cy.log("the table is" + tabValue);
        cy.get(".bp3-ui-text span").eq(1).should("have.text", tabData);
      });
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      cy.readTableV2dataFromSpecificIndex("2", "0", 1).then((tabData) => {
        const tabValue = tabData;
        cy.log("the table is" + tabValue);
        cy.get(".bp3-ui-text span").eq(0).should("have.text", tabData);
      });
    });
  },
);
