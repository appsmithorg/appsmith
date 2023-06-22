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

const oneClickBinding = new OneClickBinding();

describe("Table widget one click binding feature", () => {
  it("1.should check that queries are created and bound to table widget properly", () => {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.TABLE, 400);

    dataSources.CreateDataSource("MySql");

    cy.get("@dsName").then((dsName) => {
      entityExplorer.NavigateToSwitcher("Widgets");

      entityExplorer.SelectEntityByName("Table1", "Widgets");

      oneClickBinding.ChooseAndAssertForm(
        `New from ${dsName}`,
        dsName,
        "countryFlags",
        "File_Name",
      );
    });

    agHelper.GetNClick(oneClickBindingLocator.connectData);

    assertHelper.AssertNetworkStatus("@postExecute");

    agHelper.Sleep(2000);

    ["Country", "File_Name", "Flag"].forEach((column) => {
      agHelper.AssertElementExist(table._headerCell(column));
    });

    table.EnableEditableOfColumn("Country", "v2");

    agHelper.GetNClick(table._addNewRow, 0, true);

    table.EditTableCell(0, 0, "Aaland Islands", false);

    table.UpdateTableCell(0, 1, "Flag_Of_Macau.png");

    table.UpdateTableCell(
      0,
      2,
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Flag_of_Macau.svg/255px-Flag_of_Macau.svg",
    );

    agHelper.Sleep(2000);

    agHelper.GetNClick(table._saveNewRow, 0, true);

    assertHelper.AssertNetworkStatus("@postExecute");

    agHelper.TypeText(table._searchInput, "Flag_Of_Macau.png");

    assertHelper.AssertNetworkStatus("@postExecute");

    agHelper.AssertElementExist(table._bodyCell("Flag_Of_Macau.png"));

    agHelper.Sleep(1000);

    agHelper.Sleep(500);

    table.EditTableCell(0, 1, "Update_Flag_of_Macau.png");

    agHelper.Sleep(1000);

    (cy as any).AssertTableRowSavable(3, 0);

    (cy as any).saveTableRow(3, 0);

    assertHelper.AssertNetworkStatus("@postExecute");

    assertHelper.AssertNetworkStatus("@postExecute");

    agHelper.Sleep(500);

    agHelper.ClearTextField(table._searchInput);

    agHelper.TypeText(table._searchInput, "Update_Flag_of_Macau.png");

    assertHelper.AssertNetworkStatus("@postExecute");

    agHelper.Sleep(2000);

    agHelper.AssertElementExist(table._bodyCell("Update_Flag_of_Macau.png"));

    agHelper.ClearTextField(table._searchInput);

    agHelper.TypeText(table._searchInput, "Flag_Of_Macau.png");

    assertHelper.AssertNetworkStatus("@postExecute");

    agHelper.Sleep(2000);

    agHelper.AssertElementAbsence(table._bodyCell("Flag_Of_Macau.png"));
  });
});
