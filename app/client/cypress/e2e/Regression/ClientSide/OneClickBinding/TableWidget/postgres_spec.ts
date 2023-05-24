import * as _ from "../../../../../support/Objects/ObjectsCore";
import { ChooseAndAssertForm } from "../Utility";

describe("Table widget one click binding feature", () => {
  it("should check that queries are created and bound to table widget properly", () => {
    _.entityExplorer.DragDropWidgetNVerify("tablewidgetv2", 400);

    _.entityExplorer.NavigateToSwitcher("Explorer");

    _.dataSources.CreateDataSource("Postgres");

    cy.get("@dsName").then((dsName) => {
      _.entityExplorer.NavigateToSwitcher("Widgets");

      ChooseAndAssertForm(`New from ${dsName}`, dsName, "public.users", "name");
    });

    _.agHelper.GetNClick(".t--one-click-binding-connect-data");

    cy.wait("@postExecute");

    cy.wait(2000);

    _.agHelper.AssertElementAbsence(".t--cypress-table-overlay-header");

    _.agHelper.AssertElementAbsence(".t--cypress-table-overlay-connectdata");

    ["id", "gender", "dob", "name", "email", "phoneNo"].forEach((column) => {
      _.agHelper.AssertElementExist(
        `.t--widget-tablewidgetv2 .thead .th:contains(${column})`,
      );
    });

    _.agHelper.AssertElementExist(".t--widget-tablewidgetv2 .show-page-items");

    _.agHelper.GetNClick(".t--add-new-row", 0, true);

    (cy as any).enterTableCellValue(0, 0, "1");

    (cy as any).enterTableCellValue(1, 0, "cypress@appsmith");

    (cy as any).enterTableCellValue(2, 0, " 2016-06-22 19:10:25-07");

    (cy as any).enterTableCellValue(3, 0, " 2016-06-22 19:10:25-07");

    _.agHelper.GetNClick(`[data-testid="datepicker-container"] input`, 0, true);

    _.agHelper.GetNClick(".DayPicker-Day", 0, true);

    _.agHelper.GetNClick(".t--save-new-row", 0, true);

    _.agHelper.TypeText(".t--search-input input", "cypress@appsmith");

    cy.wait("@postExecute");

    _.agHelper.AssertElementExist(
      ".t--table-text-cell:contains('cypress@appsmith')",
    );

    (cy as any).wait(1000);

    (cy as any).editTableCell(1, 0);

    (cy as any).wait(500);

    (cy as any).enterTableCellValue(1, 0, "automation@appsmith{enter}");

    (cy as any).wait(500);

    (cy as any).saveTableRow(12, 0);

    cy.wait("@postExecute");

    (cy as any).wait(500);

    _.agHelper.ClearTextField(".t--search-input input");

    _.agHelper.TypeText(".t--search-input input", "automation@appsmith");

    cy.wait("@postExecute");

    (cy as any).wait(500);

    _.agHelper.AssertElementExist(
      ".t--table-text-cell:contains('automation@appsmith')",
    );

    _.agHelper.ClearTextField(".t--search-input input");

    _.agHelper.TypeText(".t--search-input input", "cypress@appsmith");

    cy.wait("@postExecute");

    (cy as any).wait(500);

    _.agHelper.AssertElementAbsence(
      ".t--table-text-cell:contains('cypress@appsmith')",
    );
  });
});
