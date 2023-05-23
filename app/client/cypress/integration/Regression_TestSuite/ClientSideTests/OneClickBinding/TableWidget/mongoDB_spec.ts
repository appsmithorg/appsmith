import * as _ from "../../../../../support/Objects/ObjectsCore";
import { ChooseAndAssertForm } from "../Utility";

describe("one click binding mongodb datasource", function () {
  before(() => {
    _.entityExplorer.DragDropWidgetNVerify("tablewidgetv2", 400);
  });

  it("test connect datasource", () => {
    //#region bind to mongoDB datasource
    _.entityExplorer.NavigateToSwitcher("Explorer");

    _.dataSources.CreateDataSource("Mongo");

    cy.get("@dsName").then((dsName) => {
      _.entityExplorer.NavigateToSwitcher("Widgets");

      ChooseAndAssertForm(`New from ${dsName}`, dsName, "netflix", "creator");
    });

    _.agHelper.GetNClick(".t--one-click-binding-connect-data");
    cy.wait("@postExecute");
    cy.wait(2000);
    //#endregion

    //#region validate search through table is working
    const rowWithAValidText = "Mike Flanagan";
    //enter a search text
    _.agHelper.TypeText(
      ".t--widget-tablewidgetv2 .t--search-input input",
      rowWithAValidText,
    );
    (cy as any).wait(1000);
    // check if the table rows are present for the given search entry
    _.agHelper.GetNAssertContains(
      '.t--widget-tablewidgetv2 [role="rowgroup"] [role="button"]',
      rowWithAValidText,
    );
    //#endregion

    //#region table update operation is working
    const someColumnIndex = 1;
    (cy as any).editTableCell(someColumnIndex, 0);
    //update the first value of the row
    const someUUID = Cypress._.random(0, 1e6);
    const enteredSomeValue = "123" + someUUID;

    (cy as any).enterTableCellValue(someColumnIndex, 0, enteredSomeValue);
    (cy as any).wait(1000);

    (cy as any).saveTableCellValue(someColumnIndex, 0);
    //commit that update
    (cy as any).saveTableRow(12, 0);

    (cy as any).wait(1000);

    // check if the updated value is present
    (cy as any).readTableV2data(0, someColumnIndex).then((cellData: any) => {
      expect(cellData).to.equal(enteredSomeValue);
    });
    //#endregion

    //#region check if the table insert operation works
    //clear input
    _.table.resetSearch();
    // cy.get(".t--widget-tablewidgetv2 .t--search-input input").clear();

    //lets create a new row and check to see the insert operation is working
    _.agHelper.GetNClick(".t--add-new-row");
    _.agHelper.AssertElementExist(".new-row");

    const someText = "new row " + Cypress._.random(0, 1e6);
    const searchColumnIndex = 3;
    (cy as any).enterTableCellValue(searchColumnIndex, 0, someText);

    (cy as any).saveTableCellValue(searchColumnIndex, 0);
    // save a row with some random text
    _.agHelper.GetNClickByContains(
      ".t--widget-tablewidgetv2 button",
      "Save row",
    );

    (cy as any).wait(5000);

    //search the table for a row having the text used to create a new row
    _.agHelper.TypeText(
      ".t--widget-tablewidgetv2 .t--search-input input",
      someText,
    );
    (cy as any).wait(1000);

    //check if that row is present
    _.agHelper.GetNAssertContains(
      '.t--widget-tablewidgetv2 [role="rowgroup"] [role="button"]',
      someText,
    );
    //#endregion
  });
});
