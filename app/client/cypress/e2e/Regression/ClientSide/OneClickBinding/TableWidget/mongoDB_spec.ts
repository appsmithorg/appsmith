import oneClickBindingLocator from "../../../../../locators/OneClickBindingLocator";
import {
  agHelper,
  entityExplorer,
  dataSources,
  table,
  draggableWidgets,
  assertHelper,
} from "../../../../../support/Objects/ObjectsCore";
import { OneClickBinding } from "../spec_utility";

const oneClickBinding = new OneClickBinding();

describe("one click binding mongodb datasource", function () {
  before(() => {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.TABLE, 450, 200);
  });

  it("1. test connect datasource", () => {
    //#region bind to mongoDB datasource
    entityExplorer.NavigateToSwitcher("Explorer");

    dataSources.CreateDataSource("Mongo");

    cy.get("@dsName").then((dsName) => {
      entityExplorer.SelectEntityByName("Table1", "Widgets");

      oneClickBinding.ChooseAndAssertForm(
        `New from ${dsName}`,
        dsName,
        "netflix",
        "creator",
      );
    });

    agHelper.GetNClick(oneClickBindingLocator.connectData);

    assertHelper.AssertNetworkStatus("@postExecute");

    agHelper.Sleep(2000);
    //#endregion

    //#region validate search through table is working
    const rowWithAValidText = "Mike Flanagan";
    //enter a search text
    agHelper.TypeText(table._searchInput, rowWithAValidText);
    agHelper.Sleep();
    // check if the table rows are present for the given search entry
    agHelper.GetNAssertContains(
      oneClickBindingLocator.validTableRowData,
      rowWithAValidText,
    );
    //#endregion

    //#region table update operation is working
    const someColumnIndex = 1;
    const someUUID = Cypress._.random(0, 1e6);
    const enteredSomeValue = "123" + someUUID;

    table.EditTableCell(0, someColumnIndex, enteredSomeValue);
    //(cy as any).editTableCell(someColumnIndex, 0);
    //update the first value of the row

    //(cy as any).enterTableCellValue(someColumnIndex, 0, enteredSomeValue);
    agHelper.Sleep();
    //commit that update
    (cy as any).saveTableRow(12, 0);

    agHelper.Sleep();

    // check if the updated value is present
    (cy as any).readTableV2data(0, someColumnIndex).then((cellData: any) => {
      expect(cellData).to.equal(enteredSomeValue);
    });
    //#endregion

    //#region check if the table insert operation works
    //clear input
    table.resetSearch();
    // cy.get(".t--widget-tablewidgetv2 .t--search-input input").clear();

    //lets create a new row and check to see the insert operation is working
    agHelper.GetNClick(table._addNewRow);
    agHelper.AssertElementExist(table._newRow);

    const someText = "new row " + Cypress._.random(0, 1e6);
    const searchColumnIndex = 3;
    (cy as any).enterTableCellValue(searchColumnIndex, 0, someText);

    (cy as any).saveTableCellValue(searchColumnIndex, 0);
    // save a row with some random text
    agHelper.GetNClick(table._saveNewRow, 0, true);

    agHelper.Sleep(5000);

    //search the table for a row having the text used to create a new row
    agHelper.ClearTextField(table._searchInput);
    agHelper.TypeText(table._searchInput, someText);
    agHelper.Sleep();

    //check if that row is present
    agHelper.GetNAssertContains(
      oneClickBindingLocator.validTableRowData,
      someText,
    );
    //#endregion
  });
});
