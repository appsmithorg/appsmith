import oneClickBindingLocator from "../../../../../locators/OneClickBindingLocator";
import * as _ from "../../../../../support/Objects/ObjectsCore";
import { OneClickBinding } from "../spec_utility";

const oneClickBinding = new OneClickBinding();

describe.skip("one click binding mongodb datasource", function () {
  before(() => {
    _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.TABLE, 400);
  });

  it("1. test connect datasource", () => {
    //#region bind to mongoDB datasource
    _.entityExplorer.NavigateToSwitcher("Explorer");

    _.dataSources.CreateDataSource("Mongo");

    cy.get("@dsName").then((dsName) => {
      _.entityExplorer.SelectEntityByName("Table1", "Widgets");

      oneClickBinding.ChooseAndAssertForm(
        `New from ${dsName}`,
        dsName,
        "netflix",
        "creator",
      );
    });

    _.agHelper.GetNClick(oneClickBindingLocator.connectData);

    _.agHelper.ValidateNetworkStatus("@postExecute");

    _.agHelper.Sleep(2000);
    //#endregion

    //#region validate search through table is working
    const rowWithAValidText = "Mike Flanagan";
    //enter a search text
    _.agHelper.TypeText(_.table._searchInput, rowWithAValidText);
    _.agHelper.Sleep();
    // check if the table rows are present for the given search entry
    _.agHelper.GetNAssertContains(
      oneClickBindingLocator.validTableRowData,
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
    _.agHelper.Sleep();

    (cy as any).saveTableCellValue(someColumnIndex, 0);
    //commit that update
    (cy as any).saveTableRow(12, 0);

    _.agHelper.Sleep();

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
    _.agHelper.GetNClick(_.table._addNewRow);
    _.agHelper.AssertElementExist(_.table._newRow);

    const someText = "new row " + Cypress._.random(0, 1e6);
    const searchColumnIndex = 3;
    (cy as any).enterTableCellValue(searchColumnIndex, 0, someText);

    (cy as any).saveTableCellValue(searchColumnIndex, 0);
    // save a row with some random text
    _.agHelper.GetNClick(_.table._saveNewRow, 0, true);

    _.agHelper.Sleep(5000);

    //search the table for a row having the text used to create a new row
    _.agHelper.ClearTextField(_.table._searchInput);
    _.agHelper.TypeText(_.table._searchInput, someText);
    _.agHelper.Sleep();

    //check if that row is present
    _.agHelper.GetNAssertContains(
      oneClickBindingLocator.validTableRowData,
      someText,
    );
    //#endregion
  });
});
