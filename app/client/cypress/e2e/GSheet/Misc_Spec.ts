/// <reference types="Cypress" />
import { GSHEET_DATA } from "../../fixtures/test-data-gsheet";
import {
  agHelper,
  assertHelper,
  dataSources,
  deployMode,
  draggableWidgets,
  gsheetHelper,
  homePage,
  locators,
  table,
} from "../../support/Objects/ObjectsCore";
import PageList from "../../support/Pages/PageList";
import EditorNavigation, {
  EntityType,
  PageLeftPane,
} from "../../support/Pages/EditorNavigation";

const workspaceName = "gsheet apps";
const dataSourceName = "gsheet";
let appName = "gsheet-app";
let spreadSheetName = "test-sheet";
describe(
  "GSheet Miscellaneous Tests",
  { tags: ["@tag.Datasource", "@tag.GSheet"] },
  function () {
    const columnHeaders = [
      "uniq_id",
      "japanese_name",
      "currencies",
      "specialChars",
      "product_name",
      "manufacturer",
      "price",
      "rowIndex",
    ];
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
        JSON.stringify(GSHEET_DATA),
      );
      cy.get("@postExecute").then((interception: any) => {
        agHelper.Sleep();
        expect(
          interception.response.body.data.body.properties.title,
        ).to.deep.equal(spreadSheetName);
      });
    });

    it("1. Add query from active ds tab and verify", () => {
      dataSources.CreateQueryForDS(dataSourceName);
      // entityExplorer.CreateNewDsQuery(dataSourceName);
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

    it("2. Add query from edit datasource page and verify", () => {
      dataSources.CreateQueryForDS(dataSourceName, "", "fetch_many", false);
      dataSources.ValidateNSelectDropdown("Operation", "Fetch Many");
      dataSources.ValidateNSelectDropdown("Entity", "Sheet Row(s)");
      agHelper.Sleep(500);
      dataSources.ValidateNSelectDropdown("Spreadsheet", "", spreadSheetName);
      dataSources.ValidateNSelectDropdown("Sheet name", "", "Sheet1");
      dataSources.RunQueryNVerifyResponseViews(GSHEET_DATA.length);
      dataSources.AssertQueryResponseHeaders(columnHeaders);
      dataSources.AssertQueryTableResponse(0, GSHEET_DATA[0].uniq_id);
      dataSources.AssertQueryTableResponse(1, "ホーンビィ 2014 カタログ"); // Asserting other language
      dataSources.AssertQueryTableResponse(2, "₹, $, €, ¥, £"); // Asserting different symbols
      dataSources.AssertQueryTableResponse(3, "!@#$%^&*"); // Asserting special chars
    });

    it("3. Add query from global search and verify", () => {
      dataSources.AddQueryFromGlobalSearch(dataSourceName);
      dataSources.ValidateNSelectDropdown("Operation", "Fetch Many");
      dataSources.ValidateNSelectDropdown("Entity", "Sheet Row(s)");
      agHelper.Sleep(500);
      dataSources.ValidateNSelectDropdown("Spreadsheet", "", spreadSheetName);
      dataSources.ValidateNSelectDropdown("Sheet name", "", "Sheet1");
      dataSources.RunQueryNVerifyResponseViews(GSHEET_DATA.length);
      dataSources.AssertQueryResponseHeaders(columnHeaders);
      dataSources.AssertQueryTableResponse(0, GSHEET_DATA[0].uniq_id);
      dataSources.AssertQueryTableResponse(1, "ホーンビィ 2014 カタログ"); // Asserting other language
      dataSources.AssertQueryTableResponse(2, "₹, $, €, ¥, £"); // Asserting different symbols
      dataSources.AssertQueryTableResponse(3, "!@#$%^&*"); // Asserting special chars
    });

    it("4. Generate CRUD page from active datasource page and verify", () => {
      // Navigating to active datasource page
      EditorNavigation.SelectEntityByName(
        dataSourceName,
        EntityType.Datasource,
      );

      // Select the spreadsheet and sheet name
      PageLeftPane.expandCollapseItem(spreadSheetName);
      PageLeftPane.assertPresence("Sheet1");
      PageLeftPane.expandCollapseItem("Sheet1");
      agHelper.ClickButton("Generate new page");
      agHelper.GetNClick(dataSources._selectTableDropdown, 0, true);
      agHelper.GetNClickByContains(
        dataSources._dropdownOption,
        spreadSheetName,
      );
      agHelper.Sleep(1000);
      agHelper.GetNClick(dataSources._selectSheetNameDropdown, 0, true);
      agHelper.GetNClickByContains(dataSources._dropdownOption, "Sheet1");

      // Click on generate page button and verify the page is generated
      agHelper.GetNClick(dataSources._generatePageBtn);
      assertHelper.AssertNetworkStatus("@replaceLayoutWithCRUDPage", 201);
      agHelper.AssertContains("Successfully generated a page");
      assertHelper.AssertNetworkStatus("@getActions", 200);
      assertHelper.AssertNetworkStatus("@postExecute", 200);
      assertHelper.AssertNetworkStatus("@updateLayout", 200);
      agHelper.ClickButton("Got it");
      assertHelper.AssertNetworkStatus("@updateLayout", 200);

      //deploy the app and verify the table data
      deployMode.DeployApp(
        locators._widgetInDeployed(draggableWidgets.TABLE_V1),
      );
      const data = GSHEET_DATA.filter((item) => item.rowIndex === "0")[0];
      table.ReadTableRowColumnData(0, 0, "v1").then((cellData) => {
        expect(cellData).to.eq(data.uniq_id);
      });
      table.ReadTableRowColumnData(0, 1, "v1").then((cellData) => {
        expect(cellData).to.eq(data.japanese_name);
      });
      table.ReadTableRowColumnData(0, 2, "v1").then((cellData) => {
        expect(cellData).to.eq(data.currencies);
      });
      table.ReadTableRowColumnData(0, 3, "v1").then((cellData) => {
        expect(cellData).to.eq(data.specialChars);
      });
      table.ReadTableRowColumnData(0, 4, "v1").then((cellData) => {
        expect(cellData).to.eq(data.product_name);
      });

      //Validating loaded JSON form
      agHelper.GetElement(locators._buttonByText("Update")).then((selector) => {
        cy.wrap(selector)
          .invoke("attr", "class")
          .then((classes) => {
            expect(classes).not.contain("bp3-disabled");
          });
      });

      dataSources.AssertJSONFormHeader(0, 13, "Id", "0");
      deployMode.NavigateBacktoEditor();
      table.WaitUntilTableLoad();
    });

    it("5. Generate CRUD page from entity explorer and verify", () => {
      // Adding pafe with data from entity explorer
      PageList.AddNewPage("Generate page with data");

      // Select the datasource, spreadsheet and sheet name
      agHelper.GetNClick(dataSources._selectDatasourceDropdown);
      agHelper.GetNClickByContains(dataSources._dropdownOption, dataSourceName);
      agHelper.Sleep(1000);
      agHelper.GetNClick(dataSources._selectTableDropdown, 0, true);
      agHelper.GetNClickByContains(
        dataSources._dropdownOption,
        spreadSheetName,
      );
      agHelper.Sleep(1000);
      agHelper.GetNClick(dataSources._selectSheetNameDropdown, 0, true);
      agHelper.GetNClickByContains(dataSources._dropdownOption, "Sheet1");

      // Click on generate page button and verify the page is generated
      agHelper.GetNClick(dataSources._generatePageBtn);
      assertHelper.AssertNetworkStatus("@replaceLayoutWithCRUDPage", 201);
      agHelper.AssertContains("Successfully generated a page");
      assertHelper.AssertNetworkStatus("@getActions", 200);
      assertHelper.AssertNetworkStatus("@postExecute", 200);
      assertHelper.AssertNetworkStatus("@updateLayout", 200);
      agHelper.ClickButton("Got it");
      assertHelper.AssertNetworkStatus("@updateLayout", 200);

      //deploy the app and verify the table data
      deployMode.DeployApp(
        locators._widgetInDeployed(draggableWidgets.TABLE_V1),
      );
      const data = GSHEET_DATA.filter((item) => item.rowIndex === "1")[0];
      table.ReadTableRowColumnData(1, 0, "v1").then((cellData) => {
        expect(cellData).to.eq(data.uniq_id);
      });
      table.ReadTableRowColumnData(1, 1, "v1").then((cellData) => {
        expect(cellData).to.eq(data.japanese_name);
      });
      table.ReadTableRowColumnData(1, 2, "v1").then((cellData) => {
        expect(cellData).to.eq(data.currencies);
      });
      table.ReadTableRowColumnData(1, 3, "v1").then((cellData) => {
        expect(cellData).to.eq(data.specialChars);
      });
      table.ReadTableRowColumnData(1, 5, "v1").then((cellData) => {
        expect(cellData).to.eq(data.manufacturer);
      });

      //Validating loaded JSON form
      agHelper.GetElement(locators._buttonByText("Update")).then((selector) => {
        cy.wrap(selector)
          .invoke("attr", "class")
          .then((classes) => {
            expect(classes).not.contain("bp3-disabled");
          });
      });

      dataSources.AssertJSONFormHeader(0, 13, "Id", "0");
      deployMode.NavigateBacktoEditor();
      table.WaitUntilTableLoad();
    });

    it("6. Bug: 16391 - Verify placeholder texts for insert one/many queries", function () {
      // Verify place holder text for Insert one query
      let placeholderText =
        '{\n  "name": {{nameInput.text}},\n  "dob": {{dobPicker.formattedDate}},\n  "gender": {{genderSelect.selectedOptionValue}} \n}';
      gsheetHelper.EnterBasicQueryValues(
        "Insert One",
        dataSourceName,
        spreadSheetName,
        false,
      );
      agHelper.AssertText(
        dataSources._gSheetQueryPlaceholder,
        "text",
        placeholderText,
      );

      // Verify place holder text for Insert many query
      placeholderText =
        '[{\n  "name": {{nameInput.text}},\n  "dob": {{dobPicker.formattedDate}},\n  "gender": {{genderSelect.selectedOptionValue}} \n}]';

      gsheetHelper.EnterBasicQueryValues(
        "Insert Many",
        dataSourceName,
        spreadSheetName,
        false,
      );
      agHelper.AssertText(
        dataSources._gSheetQueryPlaceholder,
        "text",
        placeholderText,
      );
    });

    // This test is commented since we can't use Cypress to go to the Google authorization screen. We will uncomment it whenever we figure out how to do it.
    // it("7. Bug#26024 App level import of gsheet app", function () {
    //   homePage.NavigateToHome();
    //   homePage.CreateNewWorkspace("AppLevelImport");
    //   homePage.CreateAppInWorkspace("AppLevelImport", "AppLevelImportCheck");
    //   appSettings.OpenAppSettings();
    //   appSettings.GoToImport();
    //   agHelper.ClickButton("Import");
    //   homePage.ImportApp("ImportAppAllAccess.json", "", true);
    //   cy.wait("@importNewApplication").then(() => {
    //     agHelper.Sleep();
    //     agHelper.ClickButton("Save & Authorize");
    //   });
    //   cy.url().should("contain", "accounts.google.com");
    //   homePage.NavigateToHome();
    //   homePage.DeleteApplication("AppLevelImportCheck");
    //   homePage.DeleteWorkspace("AppLevelImport");
    // });

    after("Delete spreadsheet and app", function () {
      // Delete spreadsheet and app
      homePage.NavigateToHome();
      homePage.SearchAndOpenApp(appName);
      gsheetHelper.DeleteSpreadsheetQuery(dataSourceName, spreadSheetName);
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
