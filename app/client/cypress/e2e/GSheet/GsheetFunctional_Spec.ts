/// <reference types="Cypress" />
import { GSHEET_DATA } from "../../fixtures/test-data-gsheet";
import {
  homePage,
  gsheetHelper,
  dataSources,
  agHelper,
  entityExplorer,
} from "../../support/Objects/ObjectsCore";

const workspaceName = "gsheet apps";
const dataSourceName = "gsheet";
let appName = "gsheet-app";
let spreadSheetName = "test-sheet";
describe("GSheet-Functional Tests", function () {
  before("Setup app and spreadsheet", function () {
    //Add a new app and an add new spreadsheet query
    //Setting up the spreadsheet name
    const uuid = Cypress._.random(0, 10000);
    spreadSheetName = spreadSheetName + "_" + uuid;
    appName = appName + "-" + uuid;

    //Adding query to insert a new spreadsheet
    homePage.NavigateToHome();
    homePage.CreateAppInWorkspace(workspaceName);
    homePage.RenameApplication(appName);
    gsheetHelper.AddNewSpreadsheetQuery(
      dataSourceName,
      spreadSheetName,
      JSON.stringify([GSHEET_DATA[0]]),
    );
    cy.get("@postExecute").then((interception: any) => {
      expect(
        interception.response.body.data.body.properties.title,
      ).to.deep.equal(spreadSheetName);
    });
  });

  it("1. Add and verify fetch details query", () => {
    entityExplorer.CreateNewDsQuery(dataSourceName);
    agHelper.RenameWithInPane("Fetch_Details");
    dataSources.ValidateNSelectDropdown(
      "Operation",
      "Fetch Many",
      "Fetch Details",
    );
    dataSources.ValidateNSelectDropdown("Entity", "Spreadsheet");
    agHelper.Sleep(500);
    dataSources.ValidateNSelectDropdown("Spreadsheet", "", spreadSheetName);
    dataSources.RunQuery();
    cy.get("@postExecute").then((interception: any) => {
      expect(interception.response.body.data.body.name).to.deep.equal(
        spreadSheetName,
      );
    });
  });

  it("2. Verify Insert one and Insert many queries", () => {
    // add insert one query and verify
    gsheetHelper.AddInsertOrUpdateQuery(
      "Insert One",
      dataSourceName,
      spreadSheetName,
      JSON.stringify(GSHEET_DATA[1]),
    );
    cy.get("@postExecute").then((interception: any) => {
      expect(interception.response.body.data.body.message).to.deep.equal(
        "Inserted row successfully!",
      );
    });

    // add insert many query and verify
    gsheetHelper.AddInsertOrUpdateQuery(
      "Insert Many",
      dataSourceName,
      spreadSheetName,
      JSON.stringify(GSHEET_DATA.slice(2, 10)),
    );
    cy.get("@postExecute").then((interception: any) => {
      expect(interception.response.body.data.body.message).to.deep.equal(
        "Inserted rows successfully!",
      );
    });
  });

  it("3. Verify Update one and Update many queries", () => {
    // add update one query and verify
    gsheetHelper.AddInsertOrUpdateQuery(
      "Update One",
      dataSourceName,
      spreadSheetName,
      JSON.stringify(GSHEET_DATA[1]),
    );
    cy.get("@postExecute").then((interception: any) => {
      expect(interception.response.body.data.body.message).to.deep.equal(
        "Updated sheet successfully!",
      );
    });

    // add update many query and verify
    gsheetHelper.AddInsertOrUpdateQuery(
      "Update Many",
      dataSourceName,
      spreadSheetName,
      JSON.stringify(GSHEET_DATA.slice(2, 4)),
    );
    cy.get("@postExecute").then((interception: any) => {
      expect(interception.response.body.data.body.message).to.deep.equal(
        "Updated sheet successfully!",
      );
    });
  });

  it("4. Verify Fetch many query", () => {
    // Add simple Fetch many query and verify
    gsheetHelper.EnterBasicQueryValues(
      "Fetch Many",
      dataSourceName,
      spreadSheetName,
    );
    dataSources.RunQueryNVerifyResponseViews(GSHEET_DATA.length);
    dataSources.AssertQueryTableResponse(0, GSHEET_DATA[0].uniq_id);

    // Update query to fetch only 1 column and verify
    gsheetHelper.selectMultiDropDownValue("Columns", "product_name");
    dataSources.RunQuery();
    dataSources.RunQueryNVerifyResponseViews(GSHEET_DATA.length);
    dataSources.AssertQueryTableResponse(0, GSHEET_DATA[0].product_name);

    //Remove column filter and add Sort By Ascending and verify
    gsheetHelper.selectMultiDropDownValue("Columns", "product_name"); //unselect the Columns dd value
    agHelper.EnterValue("price", {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Sort By",
    });
    dataSources.RunQueryNVerifyResponseViews(GSHEET_DATA.length);
    dataSources.AssertQueryTableResponse(
      1,
      "Learning Curve Chuggington Interactive Chatsworth",
    );

    // Sort by descending and verify
    dataSources.clearSortByOption(); //clearing previous sort option
    dataSources.enterSortByValues("price", "Descending");
    dataSources.RunQuery();
    dataSources.RunQueryNVerifyResponseViews(GSHEET_DATA.length);
    dataSources.AssertQueryTableResponse(
      1,
      "Hornby Gauge Western Express Digital Train Set with eLink and TTS Loco Train Set",
    );

    // Filter by where clause and verify
    agHelper.TypeDynamicInputValueNValidate(
      "price",
      dataSources._nestedWhereClauseKey(0),
    );
    agHelper.TypeDynamicInputValueNValidate(
      "100",
      dataSources._nestedWhereClauseValue(0),
    );
    dataSources.RunQuery();
    dataSources.RunQueryNVerifyResponseViews(8);
    dataSources.AssertQueryTableResponse(0, "87bbb472ef9d90dcef140a551665c929");

    // Filter by cell range and verify
    dataSources.ValidateNSelectDropdown(
      "Filter Format",
      "Where Clause",
      "Cell range",
    );
    agHelper.EnterValue("A2:A5", {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Cell range",
    });
    dataSources.RunQuery();
    dataSources.RunQueryNVerifyResponseViews(8);
    dataSources.AssertQueryTableResponse(0, "eac7efa5dbd3d667f26eb3d3ab504464");
  });

  after("Delete spreadsheet and app", function () {
    // Delete spreadsheet and app
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
