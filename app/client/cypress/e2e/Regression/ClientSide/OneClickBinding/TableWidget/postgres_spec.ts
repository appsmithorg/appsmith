import oneClickBindingLocator from "../../../../../locators/OneClickBindingLocator";
import { OneClickBinding } from "../spec_utility";
import {
  agHelper,
  entityExplorer,
  dataSources,
  table,
  draggableWidgets,
  assertHelper,
} from "../../../../../support/Objects/ObjectsCore";

const oneClickBinding = new OneClickBinding();

describe("Table widget one click binding feature", () => {
  it("should check that queries are created and bound to table widget properly", () => {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.TABLE, 450, 200);

    entityExplorer.NavigateToSwitcher("Explorer");

    dataSources.CreateDataSource("Postgres");

    cy.get("@dsName").then((dsName) => {
      entityExplorer.NavigateToSwitcher("Widgets");

      entityExplorer.SelectEntityByName("Table1", "Widgets");

      oneClickBinding.ChooseAndAssertForm(
        `${dsName}`,
        dsName,
        "public.users",
        "name",
      );
    });

    agHelper.GetNClick(oneClickBindingLocator.connectData);

    assertHelper.AssertNetworkStatus("@postExecute");

    agHelper.Sleep(2000);

    ["id", "gender", "dob", "name", "email", "phoneNo"].forEach((column) => {
      agHelper.AssertElementExist(table._headerCell(column));
    });

    agHelper.AssertElementExist(table._showPageItemsCount);
    table.EnableEditableOfColumn("id", "v2");

    table.AddNewRow();

    //const randomNumber = Cypress._.random(10, 100, false);
    //cy.log("randomeNumber: " + randomNumber);

    // table.EditTableCell(0, 0, randomNumber.toString(), false);//Bug 24623 - since 2 digit id is not typed properly
    table.EditTableCell(0, 0, 2, false);
    table.UpdateTableCell(0, 1, "cypress@appsmith");
    table.UpdateTableCell(0, 2, " 2016-06-22 19:10:25-07");
    table.UpdateTableCell(0, 3, " 2016-06-22 19:10:25-07");
    agHelper.GetNClick(oneClickBindingLocator.dateInput, 0, true);

    agHelper.GetNClick(oneClickBindingLocator.dayViewFromDate, 0, true);

    agHelper.Sleep(2000);

    agHelper.GetNClick(table._saveNewRow, 0, true);

    assertHelper.AssertNetworkStatus("@postExecute");

    agHelper.TypeText(table._searchInput, "cypress@appsmith");

    assertHelper.AssertNetworkStatus("@postExecute");

    agHelper.AssertElementExist(table._bodyCell("cypress@appsmith"));

    agHelper.Sleep();

    //(cy as any).editTableCell(1, 0);

    agHelper.Sleep(500);

    table.EditTableCell(0, 1, "automation@appsmith");

    //(cy as any).enterTableCellValue(1, 0, "automation@appsmith{enter}");

    agHelper.Sleep();

    (cy as any).AssertTableRowSavable(12, 0);

    (cy as any).saveTableRow(12, 0);

    assertHelper.AssertNetworkStatus("@postExecute");

    assertHelper.AssertNetworkStatus("@postExecute");

    agHelper.Sleep(500);

    agHelper.ClearTextField(table._searchInput);

    agHelper.TypeText(table._searchInput, "automation@appsmith");

    assertHelper.AssertNetworkStatus("@postExecute");

    agHelper.Sleep(2000);

    agHelper.AssertElementExist(table._bodyCell("automation@appsmith"));

    agHelper.ClearTextField(table._searchInput);

    agHelper.TypeText(table._searchInput, "cypress@appsmith");

    assertHelper.AssertNetworkStatus("@postExecute");

    agHelper.Sleep(2000);

    agHelper.AssertElementAbsence(table._bodyCell("cypress@appsmith"));
  });
});
