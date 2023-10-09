/// <reference types="Cypress" />
import { GSHEET_DATA } from "../../fixtures/test-data-gsheet";
import {
  homePage,
  gsheetHelper,
  dataSources,
  agHelper,
  entityExplorer,
  propPane,
  table,
  draggableWidgets,
  assertHelper,
} from "../../support/Objects/ObjectsCore";
import { Widgets } from "../../support/Pages/DataSources";
import oneClickBindingLocator from "../../locators/OneClickBindingLocator";
import { OneClickBinding } from "../Regression/ClientSide/OneClickBinding/spec_utility";

const workspaceName = "gsheet apps";
const dataSourceName = "gsheet";
let appName = "gsheet-app";
let spreadSheetName = "test-sheet";
describe("GSheet-widget binding", function () {
  before("Setup app and spreadsheet", function () {
    //Setting up the app name
    const uuid = Cypress._.random(0, 10000);
    spreadSheetName = spreadSheetName + "_" + uuid;
    appName = appName + "-" + uuid;

    //Adding app
    homePage.NavigateToHome();
    homePage.CreateAppInWorkspace(workspaceName);
    homePage.RenameApplication(appName);
    gsheetHelper.AddNewSpreadsheetQuery(
      dataSourceName,
      spreadSheetName,
      JSON.stringify(GSHEET_DATA),
    );
    cy.get("@postExecute").then((interception: any) => {
      expect(
        interception.response.body.data.body.properties.title,
      ).to.deep.equal(spreadSheetName);
    });
  });

  it("1. Verify 'Add to widget [Widget Suggestion]' functionality - GSheet", () => {
    //Adding query
    gsheetHelper.EnterBasicQueryValues(
      "Fetch Many",
      dataSourceName,
      spreadSheetName,
    );
    dataSources.RunQueryNVerifyResponseViews(10);

    // Adding suggested widgets and verify
    dataSources.AddSuggestedWidget(Widgets.Table);
    table.ReadTableRowColumnData(0, 0, "v2").then((cellData) => {
      expect(cellData).to.eq("eac7efa5dbd3d667f26eb3d3ab504464");
    });
    agHelper.GetNClick(propPane._deleteWidget);
  });

  it("2. One click binding to table widget functionality - GSheet", () => {
    //Adding table widget
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.TABLE, 450, 200);

    agHelper.GetNClick(oneClickBindingLocator.datasourceDropdownSelector);
    agHelper.GetNClick(
      oneClickBindingLocator.datasourceQuerySelector("fetch_many_query"),
    );

    // Assert table data
    table.ReadTableRowColumnData(0, 0, "v2").then((cellData) => {
      expect(cellData).to.eq("eac7efa5dbd3d667f26eb3d3ab504464");
    });
    agHelper.GetNClick(propPane._deleteWidget);
  });

  it("3. One click binding to table widget functionality - GSheet", () => {
    //Adding table widget
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.TABLE, 450, 200);

    new OneClickBinding().ChooseAndAssertForm(
      `${dataSourceName}`,
      dataSourceName,
      spreadSheetName,
      {
        searchableColumn: "product_name",
      },
    );

    agHelper.GetNClick(oneClickBindingLocator.connectData);

    assertHelper.AssertNetworkStatus("@postExecute");

    agHelper.Sleep(2000);
    //#endregion

    //#region validate search through table is working
    const rowWithAValidText = "Hornby 2014 Catalogue";
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

    //update the first value of the row
    table.EditTableCell(0, someColumnIndex, enteredSomeValue);
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
    table.ResetSearch();

    //lets create a new row and check to see the insert operation is working
    table.AddNewRow();

    const someText = "new row " + Cypress._.random(0, 1e6);
    const searchColumnIndex = 3;
    table.EditTableCell(0, searchColumnIndex, someText);
    (cy as any).saveTableCellValue(searchColumnIndex, 0);
    // save a row with some random text
    agHelper.GetNClick(table._saveNewRow, 0, true);

    agHelper.Sleep(2000);

    //search the table for a row having the text used to create a new row
    agHelper.ClearNType(table._searchInput, someText);
    agHelper.Sleep();

    //check if that row is present
    agHelper.GetNAssertContains(
      oneClickBindingLocator.validTableRowData,
      "rajat",
    );
    expect(1).to.equal(2)

    agHelper.GetNClick(propPane._deleteWidget);
  });

  after("Delete app", function () {
    // Delete spreadsheet and app
    entityExplorer.NavigateToSwitcher("Explorer");
    gsheetHelper.DeleteSpreadsheetQuery(dataSourceName, spreadSheetName);
    cy.get("@postExecute").then((interception: any) => {
      expect(interception.response.body.data.body.message).to.deep.equal(
        "Deleted spreadsheet successfully!",
      );
    });
    homePage.NavigateToHome();
    homePage.DeleteApplication(appName);
  });
});
