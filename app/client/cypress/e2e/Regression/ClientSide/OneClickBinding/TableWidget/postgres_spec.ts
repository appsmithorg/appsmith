import oneClickBindingLocator from "../../../../../locators/OneClickBindingLocator";
import * as _ from "../../../../../support/Objects/ObjectsCore";
import { OneClickBinding } from "../spec_utility";

const oneClickBinding = new OneClickBinding();

describe.skip("Table widget one click binding feature", () => {
  it("should check that queries are created and bound to table widget properly", () => {
    _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.TABLE, 400);

    _.entityExplorer.NavigateToSwitcher("Explorer");

    _.dataSources.CreateDataSource("Postgres");

    cy.get("@dsName").then((dsName) => {
      _.entityExplorer.NavigateToSwitcher("Widgets");

      _.entityExplorer.SelectEntityByName("Table1", "Widgets");

      oneClickBinding.ChooseAndAssertForm(
        `New from ${dsName}`,
        dsName,
        "public.users",
        "name",
      );
    });

    _.agHelper.GetNClick(oneClickBindingLocator.connectData);

    _.agHelper.ValidateNetworkStatus("@postExecute");

    cy.wait(2000);

    ["id", "gender", "dob", "name", "email", "phoneNo"].forEach((column) => {
      _.agHelper.AssertElementExist(_.table._headerCell(column));
    });

    _.agHelper.AssertElementExist(_.table._showPageItemsCount);

    (cy as any).makeColumnEditable("id");

    _.agHelper.GetNClick(_.table._addNewRow, 0, true);

    (cy as any).enterTableCellValue(0, 0, "3");

    (cy as any).enterTableCellValue(1, 0, "cypress@appsmith");

    (cy as any).enterTableCellValue(2, 0, " 2016-06-22 19:10:25-07");

    (cy as any).enterTableCellValue(3, 0, " 2016-06-22 19:10:25-07");

    _.agHelper.GetNClick(oneClickBindingLocator.dateInput, 0, true);

    _.agHelper.GetNClick(oneClickBindingLocator.dayViewFromDate, 0, true);

    (cy as any).wait(2000);

    _.agHelper.GetNClick(_.table._saveNewRow, 0, true);

    _.agHelper.ValidateNetworkStatus("@postExecute");

    _.agHelper.TypeText(_.table._searchInput, "cypress@appsmith");

    _.agHelper.ValidateNetworkStatus("@postExecute");

    _.agHelper.AssertElementExist(_.table._bodyCell("cypress@appsmith"));

    (cy as any).wait(1000);

    (cy as any).editTableCell(1, 0);

    (cy as any).wait(500);

    (cy as any).enterTableCellValue(1, 0, "automation@appsmith{enter}");

    (cy as any).wait(1000);

    (cy as any).AssertTableRowSavable(12, 0);

    (cy as any).saveTableRow(12, 0);

    _.agHelper.ValidateNetworkStatus("@postExecute");

    _.agHelper.ValidateNetworkStatus("@postExecute");

    (cy as any).wait(500);

    _.agHelper.ClearTextField(_.table._searchInput);

    _.agHelper.TypeText(_.table._searchInput, "automation@appsmith");

    _.agHelper.ValidateNetworkStatus("@postExecute");

    (cy as any).wait(2000);

    _.agHelper.AssertElementExist(_.table._bodyCell("automation@appsmith"));

    _.agHelper.ClearTextField(_.table._searchInput);

    _.agHelper.TypeText(_.table._searchInput, "cypress@appsmith");

    _.agHelper.ValidateNetworkStatus("@postExecute");

    (cy as any).wait(2000);

    _.agHelper.AssertElementAbsence(_.table._bodyCell("cypress@appsmith"));
  });
});
