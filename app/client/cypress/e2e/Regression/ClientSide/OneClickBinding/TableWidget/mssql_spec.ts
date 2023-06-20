import oneClickBindingLocator from "../../../../../locators/OneClickBindingLocator";
import * as _ from "../../../../../support/Objects/ObjectsCore";
import { OneClickBinding } from "../spec_utility";

const oneClickBinding = new OneClickBinding();

describe.skip("Table widget one click binding feature", () => {
  it("should check that queries are created and bound to table widget properly", () => {
    _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.TABLE, 400);

    _.entityExplorer.NavigateToSwitcher("Explorer");

    _.dataSources.CreateDataSource("MsSql", true, true, "fakeapi");

    cy.get("@dsName").then((dsName) => {
      _.entityExplorer.NavigateToSwitcher("Widgets");

      _.entityExplorer.SelectEntityByName("Table1", "Widgets");

      oneClickBinding.ChooseAndAssertForm(
        `New from ${dsName}`,
        dsName,
        "dbo.Simpsons",
        "title",
      );
    });

    _.agHelper.GetNClick(oneClickBindingLocator.connectData);

    _.assertHelper.AssertNetworkStatus("@postExecute");

    cy.wait(2000);

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
      _.agHelper.AssertElementExist(_.table._headerCell(column));
    });

    // _.agHelper.AssertElementExist(_.table._showPageItemsCount);

    (cy as any).makeColumnEditable("episode_id");

    _.agHelper.GetNClick(_.table._addNewRow, 0, true);

    (cy as any).enterTableCellValue(0, 0, "S01E01");

    (cy as any).enterTableCellValue(1, 0, "1");

    (cy as any).enterTableCellValue(2, 0, " 1");

    (cy as any).enterTableCellValue(3, 0, " 10");

    (cy as any).enterTableCellValue(4, 0, "Expanse");
    (cy as any).enterTableCellValue(5, 0, "Prime");

    (cy as any).enterTableCellValue(6, 0, "2016-06-22 19:10:25-07");
    (cy as any).enterTableCellValue(7, 0, "expanse.png");
    (cy as any).enterTableCellValue(8, 0, "5");
    (cy as any).enterTableCellValue(9, 0, "20");

    (cy as any).wait(2000);

    _.agHelper.GetNClick(_.table._saveNewRow, 0, true);

    _.assertHelper.AssertNetworkStatus("@postExecute");

    _.agHelper.TypeText(_.table._searchInput, "Expanse");

    _.assertHelper.AssertNetworkStatus("@postExecute");

    _.agHelper.AssertElementExist(_.table._bodyCell("Expanse"));

    (cy as any).wait(1000);

    (cy as any).editTableCell(1, 0);

    (cy as any).wait(500);

    (cy as any).enterTableCellValue(1, 0, "Westworld{enter}");

    (cy as any).wait(1000);

    (cy as any).AssertTableRowSavable(10, 0);

    (cy as any).saveTableRow(10, 0);

    _.assertHelper.AssertNetworkStatus("@postExecute");

    _.assertHelper.AssertNetworkStatus("@postExecute");

    (cy as any).wait(500);

    _.agHelper.ClearTextField(_.table._searchInput);

    _.agHelper.TypeText(_.table._searchInput, "Westworld");

    _.assertHelper.AssertNetworkStatus("@postExecute");

    (cy as any).wait(2000);

    _.agHelper.AssertElementExist(_.table._bodyCell("Westworld"));

    _.agHelper.ClearTextField(_.table._searchInput);

    _.agHelper.TypeText(_.table._searchInput, "Expanse");

    _.assertHelper.AssertNetworkStatus("@postExecute");

    (cy as any).wait(2000);

    _.agHelper.AssertElementAbsence(_.table._bodyCell("Expanse"));
  });
});
