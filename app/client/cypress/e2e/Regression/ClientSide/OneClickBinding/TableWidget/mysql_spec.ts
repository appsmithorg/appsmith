import oneClickBindingLocator from "../../../../../locators/OneClickBindingLocator";
import {
  agHelper,
  assertHelper,
  dataSources,
  draggableWidgets,
  entityExplorer,
  table,
} from "../../../../../support/Objects/ObjectsCore";
import { OneClickBinding } from "../spec_utility";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

const oneClickBinding = new OneClickBinding();

// TODO: Adds two rows on click of save row will debug and fix this in a different PR - Sangeeth
describe.skip("Table widget one click binding feature", () => {
  it("1.should check that queries are created and bound to table widget properly", () => {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.TABLE, 400);

    dataSources.CreateDataSource("MySql");

    cy.get("@dsName").then((dsName) => {
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);

      oneClickBinding.ChooseAndAssertForm(`${dsName}`, dsName, "configs", {
        searchableColumn: "configName",
      });
    });

    agHelper.GetNClick(oneClickBindingLocator.connectData);

    assertHelper.AssertNetworkStatus("@postExecute");

    agHelper.Sleep(2000);

    [
      "id",
      "configName",
      "configJson",
      "configVersion",
      "updatedAt",
      "updatedBy",
    ].forEach((column) => {
      agHelper.AssertElementExist(table._headerCell(column));
    });

    agHelper.GetNClick(table._addNewRow, 0, true);

    table.EditTableCell(0, 1, "One Click Config", false);

    table.UpdateTableCell(0, 2, `{{}"key":"oneClick"}`);
    table.UpdateTableCell(0, 3, 36);
    table.UpdateTableCell(0, 4, "2023-07-03 15:30:00", false, true);

    agHelper.Sleep(2000);

    agHelper.GetNClick(table._saveNewRow, 0, true);

    assertHelper.AssertNetworkStatus("@postExecute");

    agHelper.TypeText(table._searchInput, "One Click Config");

    assertHelper.AssertNetworkStatus("@postExecute");

    agHelper.AssertElementExist(table._bodyCell("One Click Config"));

    agHelper.Sleep(1000);

    table.EditTableCell(0, 1, "Bindings", false);
    table.EditTableCell(0, 4, "2023-07-03 15:30:00", false);

    agHelper.Sleep(1000);

    (cy as any).AssertTableRowSavable(6, 0);

    (cy as any).saveTableRow(6, 0);

    assertHelper.AssertNetworkStatus("@postExecute");

    assertHelper.AssertNetworkStatus("@postExecute");

    agHelper.Sleep(500);
    agHelper.ClearNType(table._searchInput, "Bindings");

    assertHelper.AssertNetworkStatus("@postExecute");

    agHelper.Sleep(2000);

    agHelper.AssertElementExist(table._bodyCell("Bindings"));

    agHelper.ClearNType(table._searchInput, "One Click Config");

    assertHelper.AssertNetworkStatus("@postExecute");

    agHelper.Sleep(2000);

    agHelper.AssertElementAbsence(table._bodyCell("One Click Config"));
  });
});
