import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

const widgetsPage = require("../../../../../locators/Widgets.json");
import {
  agHelper,
  deployMode,
  entityExplorer,
  propPane,
  table,
} from "../../../../../support/Objects/ObjectsCore";

/*
Selected row stays selected after data updation
if the primary column value isn't updated.
*/
describe(
  "Table Widget row multi select validation",
  { tags: ["@tag.Widget", "@tag.Table", "@tag.Binding"] },
  function () {
    before(() => {
      agHelper.AddDsl("multiSelectedRowUpdationDsl");
    });

    it("Test multi select column shows when enableMultirowselection is true and not when enableMultirowselection is off", function () {
      agHelper.GetNClick(widgetsPage.buttonWidget);
      cy.get(widgetsPage.buttonWidget).last().click();
      deployMode.DeployApp();
      agHelper.GetNClick(table._multirowselect, 1);
      agHelper.GetNClick(table._multirowselect, 2);
      agHelper.AssertElementLength(table._selectedrow, 2);
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      propPane.TogglePropertyState("Enable multi row selection", "Off");
      deployMode.DeployApp();
      agHelper.AssertElementAbsence(table._multirowselect);
    });
  },
);
