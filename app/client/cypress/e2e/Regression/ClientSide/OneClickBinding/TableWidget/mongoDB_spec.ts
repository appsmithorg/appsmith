import oneClickBindingLocator from "../../../../../locators/OneClickBindingLocator";
import * as _ from "../../../../../support/Objects/ObjectsCore";
import { OneClickBinding } from "../spec_utility";
import {
  entityExplorer,
  dataSources,
  agHelper,
  assertHelper,
  table,
  draggableWidgets,
} from "../../../../../support/Objects/ObjectsCore";

const oneClickBinding = new OneClickBinding();

describe("one click binding mongodb datasource", function () {
  before(() => {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.TABLE, 800, 600);
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
    (cy as any).editTableCell(someColumnIndex, 0);
    //update the first value of the row
    const someUUID = Cypress._.random(0, 1e6);
    const enteredSomeValue = "123" + someUUID;

    table.EditTableCell(0, someColumnIndex, enteredSomeValue);

    agHelper.Sleep();

    (cy as any).saveTableCellValue(someColumnIndex, 0);
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
    table.EditTableCell(0, searchColumnIndex, someText);

    (cy as any).saveTableCellValue(searchColumnIndex, 0);
    // save a row with some random text
    agHelper.GetNClick(table._saveNewRow, 0, true);
    assertHelper.AssertNetworkStatus("@postExecute");
    agHelper.Sleep();
    agHelper.Sleep();

    //search the table for a row having the text used to create a new row
    agHelper.ClearTextField(table._searchInput);
    agHelper.TypeText(table._searchInput, someText);
    agHelper.Sleep();
    assertHelper.AssertNetworkStatus("@postExecute");
    agHelper.AssertElementVisible(oneClickBindingLocator.validTableRowData);
    agHelper.Sleep();

    //check if that row is present
    agHelper.GetNAssertContains(
      oneClickBindingLocator.validTableRowData,
      someText,
    );
    //#endregion
  });
});
