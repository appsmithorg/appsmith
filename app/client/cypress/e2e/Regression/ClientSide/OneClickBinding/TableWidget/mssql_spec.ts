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

    entityExplorer.NavigateToSwitcher("Explorer");

    dataSources.CreateDataSource("MsSql", true, true, "fakeapi");

    cy.get("@dsName").then((dsName) => {
      entityExplorer.NavigateToSwitcher("Widgets");

      entityExplorer.SelectEntityByName("Table1", "Widgets");

      oneClickBinding.ChooseAndAssertForm(
        `New from ${dsName}`,
        dsName,
        "dbo.Simpsons",
        "title",
      );
    });

    agHelper.GetNClick(oneClickBindingLocator.connectData);

    assertHelper.AssertNetworkStatus("@postExecute");

    agHelper.Sleep(2000);

    [
      "episode_id",
      "season",
      "episode",
      "number_in_series",
      "title",
      "summary",
      "air_date",
      "episode_image",
      "rating",
      "votes",
    ].forEach((column) => {
      agHelper.AssertElementExist(table._headerCell(column));
    });

    // agHelper.AssertElementExist(table._showPageItemsCount);

    table.EnableEditableOfColumn("episode_id", "v2");

    agHelper.GetNClick(table._addNewRow, 0, true);

    table.EditTableCell(0, 0, "S01E01", false);

    table.UpdateTableCell(1, 0, "1");

    table.UpdateTableCell(2, 0, " 1");

    table.UpdateTableCell(3, 0, " 10");

    table.UpdateTableCell(4, 0, "Expanse");
    table.UpdateTableCell(5, 0, "Prime");

    table.UpdateTableCell(6, 0, "2016-06-22 19:10:25-07");
    table.UpdateTableCell(7, 0, "expanse.png");
    table.UpdateTableCell(8, 0, "5");
    table.UpdateTableCell(9, 0, "20");

    agHelper.Sleep(2000);

    agHelper.GetNClick(table._saveNewRow, 0, true);

    assertHelper.AssertNetworkStatus("@postExecute");

    agHelper.TypeText(table._searchInput, "Expanse");

    assertHelper.AssertNetworkStatus("@postExecute");

    agHelper.AssertElementExist(table._bodyCell("Expanse"));

    agHelper.Sleep(1000);

    // (cy as any).editTableCell(1, 0);

    agHelper.Sleep(500);

    table.UpdateTableCell(1, 0, "Westworld");

    agHelper.Sleep(1000);

    (cy as any).AssertTableRowSavable(10, 0);

    (cy as any).saveTableRow(10, 0);

    assertHelper.AssertNetworkStatus("@postExecute");

    assertHelper.AssertNetworkStatus("@postExecute");

    agHelper.Sleep(500);

    agHelper.ClearTextField(table._searchInput);

    agHelper.TypeText(table._searchInput, "Westworld");

    assertHelper.AssertNetworkStatus("@postExecute");

    agHelper.Sleep(2000);

    agHelper.AssertElementExist(table._bodyCell("Westworld"));

    agHelper.ClearTextField(table._searchInput);

    agHelper.TypeText(table._searchInput, "Expanse");

    assertHelper.AssertNetworkStatus("@postExecute");

    agHelper.Sleep(2000);

    agHelper.AssertElementAbsence(table._bodyCell("Expanse"));
  });
});
