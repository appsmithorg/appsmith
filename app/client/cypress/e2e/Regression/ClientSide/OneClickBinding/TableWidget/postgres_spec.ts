import oneClickBindingLocator from "../../../../../locators/OneClickBindingLocator";
import { OneClickBinding } from "../spec_utility";
import {
  entityExplorer,
  draggableWidgets,
  dataSources,
  agHelper,
  assertHelper,
  table,
} from "../../../../../support/Objects/ObjectsCore";
const oneClickBinding = new OneClickBinding();

describe("Table widget one click binding feature", () => {
  it("should check that queries are created and bound to table widget properly", () => {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.TABLE, 800, 600);
    entityExplorer.NavigateToSwitcher("Explorer");
    dataSources.CreateDataSource("Postgres");
    cy.get("@dsName").then((dsName) => {
      entityExplorer.NavigateToSwitcher("Widgets");
      entityExplorer.SelectEntityByName("Table1", "Widgets");
      oneClickBinding.ChooseAndAssertForm(
        `New from ${dsName}`,
        dsName,
        "public.users",
        "name",
      );
    });
    agHelper.GetNClick(oneClickBindingLocator.connectData);

    assertHelper.AssertNetworkStatus("@postExecute");

    cy.wait(2000);
    ["id", "gender", "dob", "name", "email", "phoneNo"].forEach((column) => {
      agHelper.AssertElementExist(table._headerCell(column));
    });
    agHelper.AssertElementExist(table._showPageItemsCount);
    (cy as any).makeColumnEditable("id");
    agHelper.GetNClick(table._addNewRow, 0, true);
    table.EditTableCell(0, 0, "3");
    table.EditTableCell(0, 1, "cypress@appsmith");
    table.EditTableCell(0, 2, " 2016-06-22 19:10:25-07");
    table.EditTableCell(0, 3, " 2016-06-22 19:10:25-07");
    table.EditTableCell(0, 10, " 2016-06-22 19:10:25-07");
    agHelper.GetNClick(oneClickBindingLocator.dateInput, 0, true);
    agHelper.GetNClick(oneClickBindingLocator.dayViewFromDate, 0, true);
    (cy as any).wait(2000);
    agHelper.GetNClick(table._saveNewRow, 0, true);

    assertHelper.AssertNetworkStatus("@postExecute");

    agHelper.TypeText(table._searchInput, "cypress@appsmith");

    assertHelper.AssertNetworkStatus("@postExecute");

    agHelper.AssertElementExist(table._bodyCell("cypress@appsmith"));

    (cy as any).wait(1000);
    agHelper.WaitUntilAllToastsDisappear();

    (cy as any).editTableCell(1, 0);
    (cy as any).wait(500);
    table.EditTableCell(0, 1, "automation@appsmith{enter}");
    (cy as any).wait(1000);
    (cy as any).AssertTableRowSavable(12, 0);
    (cy as any).saveTableRow(12, 0);

    assertHelper.AssertNetworkStatus("@postExecute");

    assertHelper.AssertNetworkStatus("@postExecute");

    (cy as any).wait(500);

    agHelper.ClearTextField(table._searchInput);

    agHelper.TypeText(table._searchInput, "automation@appsmith");

    assertHelper.AssertNetworkStatus("@postExecute");

    (cy as any).wait(2000);

    agHelper.AssertElementExist(table._bodyCell("automation@appsmith"));

    agHelper.ClearTextField(table._searchInput);

    agHelper.TypeText(table._searchInput, "cypress@appsmith");

    assertHelper.AssertNetworkStatus("@postExecute");

    (cy as any).wait(2000);

    agHelper.AssertElementAbsence(table._bodyCell("cypress@appsmith"));
  });
});
