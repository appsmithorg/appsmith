/// <reference types="Cypress" />
import { GSHEET_DATA } from "../../fixtures/test-data-gsheet";
import { featureFlagIntercept } from "../../support/Objects/FeatureFlags";
import {
  homePage,
  gsheetHelper,
  dataSources,
  agHelper,
  entityExplorer,
  assertHelper,
  table,
  appSettings,
} from "../../support/Objects/ObjectsCore";

describe.skip(
  "GSheet-Functional Tests With Read/Write Access",
  {
    tags: ["@tag.Datasource", "@tag.GSheet", "@tag.Git", "@tag.AccessControl"],
  },
  function () {
    const workspaceName = "gsheet apps";
    const dataSourceName = {
      allAccess: "gsheet-all",
      readNWrite: "gsheet-read-write",
    };
    let appName = "gsheet-app";
    let spreadSheetName = "test-sheet";

    before("Setup app and spreadsheet", function () {
      //Add a new app and an add new spreadsheet query
      //Setting up the spreadsheet name
      const uuid = Cypress._.random(0, 10000);
      spreadSheetName = spreadSheetName + "_" + uuid;
      appName = appName + "-" + uuid;

      //Adding query to insert a new spreadsheet
      homePage.NavigateToHome();
      homePage.SelectWorkspace(workspaceName);
      homePage.CreateAppInWorkspace(workspaceName, appName);
      gsheetHelper.AddNewSpreadsheetQuery(
        dataSourceName.readNWrite,
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
      entityExplorer.CreateNewDsQuery(dataSourceName.readNWrite);
      agHelper.RenameQuery("Fetch_Details");
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
        dataSourceName.readNWrite,
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
        dataSourceName.readNWrite,
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
        dataSourceName.readNWrite,
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
        dataSourceName.readNWrite,
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
        dataSourceName.readNWrite,
        spreadSheetName,
      );
      dataSources.runQueryAndVerifyResponseViews({ count: GSHEET_DATA.length });
      dataSources.AssertQueryTableResponse(0, GSHEET_DATA[0].uniq_id);
      dataSources.AssertQueryTableResponse(1, "ホーンビィ 2014 カタログ"); // Asserting other language
      dataSources.AssertQueryTableResponse(2, "₹, $, €, ¥, £"); // Asserting different symbols
      dataSources.AssertQueryTableResponse(3, "!@#$%^&*"); // Asserting special chars
      // Update query to fetch only 1 column and verify
      gsheetHelper.SelectMultiDropDownValue("Columns", "product_name");
      dataSources.RunQuery();
      dataSources.runQueryAndVerifyResponseViews({ count: GSHEET_DATA.length });
      dataSources.AssertQueryTableResponse(0, GSHEET_DATA[0].product_name);
      //Remove column filter and add Sort By Ascending and verify
      gsheetHelper.SelectMultiDropDownValue("Columns", "product_name"); //unselect the Columns dd value
      agHelper.EnterValue("price", {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Sort By",
      });
      dataSources.runQueryAndVerifyResponseViews({ count: GSHEET_DATA.length });
      dataSources.AssertQueryTableResponse(
        0,
        "5afbaf65680c9f378af5b3a3ae22427e",
      );
      dataSources.AssertQueryTableResponse(
        1,
        "ラーニング カーブ チャギントン インタラクティブ チャッツワース",
      ); // Asserting other language
      dataSources.AssertQueryTableResponse(2, "₹, $, €, ¥, £"); // Asserting different symbols
      dataSources.AssertQueryTableResponse(3, "!@#$%^&*"); // Asserting special chars
      // Sort by descending and verify
      dataSources.ClearSortByOption(); //clearing previous sort option
      dataSources.EnterSortByValues("price", "Descending");
      dataSources.RunQuery();
      dataSources.runQueryAndVerifyResponseViews({ count: GSHEET_DATA.length });
      dataSources.AssertQueryTableResponse(
        1,
        "ホーンビー ゲージ ウェスタン エクスプレス デジタル トレイン セット (eLink および TTS ロコ トレイン セット付き)",
      ); // Asserting other language
      dataSources.AssertQueryTableResponse(
        4,
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
      dataSources.runQueryAndVerifyResponseViews({ count: 8 });
      dataSources.AssertQueryTableResponse(
        0,
        "87bbb472ef9d90dcef140a551665c929",
      );
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
      dataSources.runQueryAndVerifyResponseViews({ count: 4 });
      dataSources.AssertQueryTableResponse(
        0,
        "eac7efa5dbd3d667f26eb3d3ab504464",
      );
    });

    it("5. Update a record which is not present and verify the error", () => {
      //preparing data
      let data = GSHEET_DATA[1];
      data.rowIndex = "15";
      // add update one query and verify
      gsheetHelper.EnterBasicQueryValues(
        "Update One",
        dataSourceName.readNWrite,
        spreadSheetName,
        false,
      );
      agHelper.EnterValue(JSON.stringify(data), {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Update row object",
      });
      dataSources.RunQuery({
        expectedStatus: false,
      });
      cy.get("@postExecute").then((interception: any) => {
        expect(interception.response.body.data.body).to.deep.equal(
          "No data found at this row index.",
        );
      });
    });

    it("6. Convert field to JS and verify", () => {
      // Switch js on sheet name then run query and verify
      gsheetHelper.EnterBasicQueryValues(
        "Fetch Many",
        dataSourceName.readNWrite,
        spreadSheetName,
        false,
      );
      agHelper.GetNClick(
        dataSources._getJSONswitchLocator("Sheet name"),
        0,
        true,
      );
      dataSources.runQueryAndVerifyResponseViews({ count: 10 });
      dataSources.AssertQueryTableResponse(
        0,
        "eac7efa5dbd3d667f26eb3d3ab504464",
      );
      //Enter a wrong sheet name then run query and verify
      agHelper.EnterValue("Sheet 2", {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Sheet name",
      });
      dataSources.RunQuery({
        expectedStatus: false,
      });
      cy.get("@postExecute").then((interception: any) => {
        expect(interception.response.body.data.body).to.deep.equal(
          "Unable to parse range: 'Sheet 2'!1:1",
        );
      });
      //Covert sheet name field to dropdown then run query and verify
      agHelper.HoverElement(dataSources._getJSONswitchLocator("Sheet name"));
      agHelper.AssertTooltip("Clear the field to toggle back");
      agHelper.EnterValue("", {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Sheet name",
      }); //Clearing the sheet name field
      agHelper.GetNClick(
        dataSources._getJSONswitchLocator("Sheet name"),
        0,
        true,
      ); // Converting the field to dropdown
      dataSources.ValidateNSelectDropdown("Sheet name", "", "Sheet1");
      dataSources.runQueryAndVerifyResponseViews({ count: 10 });
      dataSources.AssertQueryTableResponse(
        0,
        "eac7efa5dbd3d667f26eb3d3ab504464",
      );
    });

    it("7. Delete row with Read/Write | All google sheets permission", () => {
      gsheetHelper.EnterBasicQueryValues(
        "Delete One",
        dataSourceName.readNWrite,
        spreadSheetName,
      );
      agHelper.EnterValue(GSHEET_DATA[0].rowIndex, {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Row Index",
      });
      dataSources.RunQuery();
      cy.get("@postExecute").then((interception: any) => {
        expect(interception.response.body.data.body.message).to.deep.equal(
          "Deleted row successfully!",
        );
      });
    });

    it("8. Delete spreadsheet with Read/Write | All google sheets permission", () => {
      gsheetHelper.EnterBasicQueryValues(
        "Delete One",
        dataSourceName.readNWrite,
        spreadSheetName,
        false,
        "Spreadsheet",
      );
      dataSources.RunQuery({
        expectedStatus: false,
      });
      cy.get("@postExecute").then((interception: any) => {
        expect(interception.response.body.data.body).to.deep.equal(
          "Request had insufficient authentication scopes.",
        );
      });
    });

    it("9. Import an app with read write access sheet", function () {
      homePage.NavigateToHome();
      homePage.ImportApp("ImportAppReadWriteAccess.json", workspaceName);
      assertHelper.WaitForNetworkCall("importNewApplication").then(() => {
        agHelper.Sleep();
        //Validate table is not empty!
        table.WaitUntilTableLoad(0, 0, "v2");
      });
      // Assert table data
      table.ReadTableRowColumnData(0, 0, "v2").then((cellData) => {
        expect(cellData).to.eq("eac7efa5dbd3d667f26eb3d3ab504464");
      });
      homePage.NavigateToHome();
      homePage.DeleteApplication("ImportAppReadWriteAccess");
    });

    it("10. App level import of app with read and write access gsheet", function () {
      homePage.CreateAppInWorkspace(workspaceName, "AppLevelImportReadNWrite");
      appSettings.OpenAppSettings();
      appSettings.GoToImport();
      agHelper.ClickButton("Import");
      homePage.ImportApp("ImportAppReadWriteAccess.json", "", true);
      cy.wait("@importNewApplication").then(() => {
        agHelper.Sleep();
        agHelper.RefreshPage();
        table.WaitUntilTableLoad(0, 0, "v2");
      });
      // Assert table data
      table.ReadTableRowColumnData(0, 0, "v2").then((cellData) => {
        expect(cellData).to.eq("eac7efa5dbd3d667f26eb3d3ab504464");
      });
      homePage.NavigateToHome();
      homePage.DeleteApplication("AppLevelImportReadNWrite");
    });

    after("Delete spreadsheet and app", function () {
      // Delete spreadsheet and app
      homePage.EditAppFromAppHover(appName);
      gsheetHelper.DeleteSpreadsheetQuery(
        dataSourceName.allAccess,
        spreadSheetName,
      );
      cy.get("@postExecute").then((interception: any) => {
        expect(interception.response.body.data.body.message).to.deep.equal(
          "Deleted spreadsheet successfully!",
        );
      });
      homePage.NavigateToHome();
      homePage.DeleteApplication(appName);
    });
  },
);
