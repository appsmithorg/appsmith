import oneClickBindingLocator from "../../../../../locators/OneClickBindingLocator";
import * as _ from "../../../../../support/Objects/ObjectsCore";
import { OneClickBinding } from "../spec_utility";

const oneClickBinding = new OneClickBinding();

describe("Table widget one click binding feature", () => {
  it("should check that queries are created and bound to table widget properly", () => {
    _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.TABLE, 400);

    _.entityExplorer.NavigateToSwitcher("Explorer");

    _.dataSources.CreateDataSource("MySql");

    cy.get("@dsName").then((dsName) => {
      _.entityExplorer.NavigateToSwitcher("Widgets");

      _.entityExplorer.SelectEntityByName("Table1", "Widgets");

      oneClickBinding.ChooseAndAssertForm(
        `New from ${dsName}`,
        dsName,
        "countryFlags",
        "File_Name",
      );
    });

    _.agHelper.GetNClick(oneClickBindingLocator.connectData);

    _.agHelper.AssertNetworkStatus("@postExecute");

    cy.wait(2000);

    ["Country", "File_Name", "Flag"].forEach((column) => {
      _.agHelper.AssertElementExist(_.table._headerCell(column));
    });

    // _.agHelper.AssertElementExist(_.table._showPageItemsCount);

    (cy as any).makeColumnEditable("Country");

    _.agHelper.GetNClick(_.table._addNewRow, 0, true);

    (cy as any).enterTableCellValue(0, 0, "Aaland Islands");

    (cy as any).enterTableCellValue(1, 0, "Flag_Of_Macau.png");

    (cy as any).enterTableCellValue(
      2,
      0,
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Flag_of_Macau.svg/255px-Flag_of_Macau.svg",
    );

    (cy as any).wait(2000);

    _.agHelper.GetNClick(_.table._saveNewRow, 0, true);

    _.agHelper.AssertNetworkStatus("@postExecute");

    _.agHelper.TypeText(_.table._searchInput, "Flag_Of_Macau.png");

    _.agHelper.AssertNetworkStatus("@postExecute");

    _.agHelper.AssertElementExist(_.table._bodyCell("Flag_Of_Macau.png"));

    (cy as any).wait(1000);

    (cy as any).editTableCell(1, 0);

    (cy as any).wait(500);

    (cy as any).enterTableCellValue(1, 0, "Update_Flag_of_Macau.png{enter}");

    (cy as any).wait(1000);

    (cy as any).AssertTableRowSavable(3, 0);

    (cy as any).saveTableRow(3, 0);

    _.agHelper.AssertNetworkStatus("@postExecute");

    _.agHelper.AssertNetworkStatus("@postExecute");

    (cy as any).wait(500);

    _.agHelper.ClearTextField(_.table._searchInput);

    _.agHelper.TypeText(_.table._searchInput, "Update_Flag_of_Macau.png");

    _.agHelper.AssertNetworkStatus("@postExecute");

    (cy as any).wait(2000);

    _.agHelper.AssertElementExist(
      _.table._bodyCell("Update_Flag_of_Macau.png"),
    );

    _.agHelper.ClearTextField(_.table._searchInput);

    _.agHelper.TypeText(_.table._searchInput, "Flag_Of_Macau.png");

    _.agHelper.AssertNetworkStatus("@postExecute");

    (cy as any).wait(2000);

    _.agHelper.AssertElementAbsence(_.table._bodyCell("Flag_Of_Macau.png"));
  });
});
