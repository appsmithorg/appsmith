import { WIDGET } from "../../../../../locators/WidgetLocators";
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe.skip("Table widget one click binding feature", () => {
  it("should check that queries are created and bound to table widget properly", () => {
    _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.TABLE, 400);

    _.entityExplorer.NavigateToSwitcher("Explorer");

    _.dataSources.CreateDataSource("Postgres");

    cy.get("@dsName").then((dsName) => {
      _.entityExplorer.NavigateToSwitcher("Widgets");

      (cy as any).openPropertyPane(WIDGET.TABLE);

      _.oneClickBinding.ChooseAndAssertForm(
        `New from ${dsName}`,
        dsName,
        "public.users",
        "name",
      );
    });

    _.agHelper.GetNClick(_.oneClickBinding.locator.connectData);

    cy.wait("@postExecute");

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

    _.agHelper.GetNClick(_.oneClickBinding.locator.dateInput, 0, true);

    _.agHelper.GetNClick(_.oneClickBinding.locator.dayViewFromDate, 0, true);

    (cy as any).wait(2000);

    _.agHelper.GetNClick(_.table._saveNewRow, 0, true);

    cy.wait("@postExecute");

    _.agHelper.TypeText(_.table._searchInput, "cypress@appsmith");

    cy.wait("@postExecute");

    _.agHelper.AssertElementExist(_.table._bodyCell("cypress@appsmith"));

    (cy as any).wait(1000);

    (cy as any).editTableCell(1, 0);

    (cy as any).wait(500);

    (cy as any).enterTableCellValue(1, 0, "automation@appsmith{enter}");

    (cy as any).wait(1000);

    (cy as any).AssertTableRowSavable(12, 0);

    (cy as any).saveTableRow(12, 0);

    cy.wait("@postExecute");

    cy.wait("@postExecute");

    (cy as any).wait(500);

    _.agHelper.ClearTextField(_.table._searchInput);

    _.agHelper.TypeText(_.table._searchInput, "automation@appsmith");

    cy.wait("@postExecute");

    (cy as any).wait(2000);

    _.agHelper.AssertElementExist(_.table._bodyCell("automation@appsmith"));

    _.agHelper.ClearTextField(_.table._searchInput);

    _.agHelper.TypeText(_.table._searchInput, "cypress@appsmith");

    cy.wait("@postExecute");

    (cy as any).wait(2000);

    _.agHelper.AssertElementAbsence(_.table._bodyCell("cypress@appsmith"));
  });
});
