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
  before("Add a new app and an add new spreadsheet query", () => {
    //Setting up the spreadsheet name
    const uuid = Cypress._.random(0, 10000);
    spreadSheetName = spreadSheetName + "_" + uuid;
    appName = appName + "-" + uuid;

    //Set initial data to be added in the gsheet
    let data = GSHEET_DATA[0];
    data["rowIndex"] = "1";

    //Adding query to insert a new spreadsheet
    homePage.NavigateToHome();
    homePage.CreateAppInWorkspace(workspaceName);
    homePage.RenameApplication(appName);
    gsheetHelper.AddNewSpreadsheetQuery(
      dataSourceName,
      spreadSheetName,
      JSON.stringify([data]),
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
      JSON.stringify(GSHEET_DATA.slice(2, 4)),
    );
    cy.get("@postExecute").then((interception: any) => {
      expect(interception.response.body.data.body.message).to.deep.equal(
        "Inserted rows successfully!",
      );
    });
  });

  it("3. Verify Update one and Update many queries", () => {
    // add insert one query and verify
    gsheetHelper.AddInsertOrUpdateQuery(
      "Update One",
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
      "Update Many",
      dataSourceName,
      spreadSheetName,
      JSON.stringify(GSHEET_DATA.slice(2, 4)),
    );
    cy.get("@postExecute").then((interception: any) => {
      expect(interception.response.body.data.body.message).to.deep.equal(
        "Inserted rows successfully!",
      );
    });
  });

  after("Delete spreadsheet and app", () => {
    gsheetHelper.DeleteSpreadsheetQuery(dataSourceName, spreadSheetName);
    homePage.NavigateToHome();
    homePage.DeleteApplication(appName);
    cy.get("@postExecute").then((interception: any) => {
      expect(interception.response.body.data.body.message).to.deep.equal(
        "Deleted spreadsheet successfully!",
      );
    });
  });
});
