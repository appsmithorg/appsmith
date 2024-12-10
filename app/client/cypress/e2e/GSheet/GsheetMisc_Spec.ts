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
import { featureFlagIntercept } from "../../support/Objects/FeatureFlags";

const workspaceName = "gsheet apps";
const dataSourceName = "gsheet-all";
let appName = "gsheet-app";
let spreadSheetName = "test-sheet";
describe(
  "GSheet Miscellaneous Tests",
  {
    tags: ["@tag.Datasource", "@tag.GSheet", "@tag.Git", "@tag.AccessControl"],
  },
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
      // intercept features call gsheet all sheets enabled
      featureFlagIntercept({
        release_gs_all_sheets_options_enabled: true,
      });
      //Add a new app and an add new spreadsheet query
      //Setting up the spreadsheet name
      const uuid = Cypress._.random(0, 10000);
      spreadSheetName = spreadSheetName + "_" + uuid;
      appName = appName + "-" + uuid;

      //Adding query to insert a new spreadsheet
      homePage.NavigateToHome();
      homePage.SelectWorkspace(workspaceName);
      homePage.CreateAppInWorkspace(workspaceName);
      homePage.RenameApplication(appName);
      gsheetHelper.AddNewSpreadsheetQuery(
        dataSourceName,
        spreadSheetName,
        JSON.stringify(GSHEET_DATA),
      );
      cy.get("@postExecute", {
        timeout: Cypress.config("pageLoadTimeout"),
      }).then((interception: any) => {
        expect(
          interception.response.body.data.body.properties.title,
        ).to.deep.equal(spreadSheetName);
      });
    });

    it("1. Add query from active ds tab and verify", () => {
      dataSources.CreateQueryForDS(dataSourceName);
      // entityExplorer.CreateNewDsQuery(dataSourceName);
      agHelper.RenameQuery("Fetch_Details");
      dataSources.ValidateNSelectDropdown(
        "Operation",
        "Fetch Many",
        "Fetch Details",
      );
      dataSources.ValidateNSelectDropdown("Entity", "Spreadsheet");
      dataSources.ValidateNSelectDropdown("Spreadsheet", "", spreadSheetName);
      dataSources.RunQuery();
      cy.get("@postExecute", {
        timeout: Cypress.config("pageLoadTimeout"),
      }).then((interception: any) => {
        expect(interception.response.body.data.body.name).to.deep.equal(
          spreadSheetName,
        );
      });
    });

    it("2. Add query from edit datasource page and verify", () => {
      dataSources.CreateQueryForDS(dataSourceName, "", "fetch_many", false);
      dataSources.ValidateNSelectDropdown("Operation", "Fetch Many");
      dataSources.ValidateNSelectDropdown("Entity", "Sheet Row(s)");
      dataSources.ValidateNSelectDropdown("Spreadsheet", "", spreadSheetName);
      dataSources.ValidateNSelectDropdown("Sheet name", "", "Sheet1");
      dataSources.runQueryAndVerifyResponseViews({ count: GSHEET_DATA.length });
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
      dataSources.ValidateNSelectDropdown("Spreadsheet", "", spreadSheetName);
      dataSources.ValidateNSelectDropdown("Sheet name", "", "Sheet1");
      dataSources.runQueryAndVerifyResponseViews({ count: GSHEET_DATA.length });
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
      agHelper.AssertElementAbsence(
        locators._btnSpinner,
        Cypress.config("defaultCommandTimeout"),
      );
      PageLeftPane.assertPresence("Sheet1");
      PageLeftPane.expandCollapseItem("Sheet1");
      agHelper.ClickButton("Generate new page");

      // Click on generate page button and verify the page is generated
      assertHelper.AssertNetworkStatus("@replaceLayoutWithCRUDPage", 201);
      agHelper.AssertContains("Successfully generated a page");
      assertHelper.AssertNetworkStatus("@getActions", 200);
      assertHelper.AssertNetworkStatus("@postExecute", 200);
      assertHelper.AssertNetworkStatus("@updateLayout", 200);
      agHelper.ClickButton("Got it");
      assertHelper.AssertNetworkStatus("@updateLayout", 200);

      //deploy the app and verify the table data
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.TABLE));
      const data = GSHEET_DATA.filter((item) => item.rowIndex === "0")[0];
      table.ReadTableRowColumnData(0, 0, "v2").then((cellData) => {
        expect(cellData).to.eq(data.uniq_id);
      });
      table.ReadTableRowColumnData(0, 1, "v2").then((cellData) => {
        expect(cellData).to.eq(data.japanese_name);
      });
      table.ReadTableRowColumnData(0, 2, "v2").then((cellData) => {
        expect(cellData).to.eq(data.currencies);
      });
      table.ReadTableRowColumnData(0, 3, "v2").then((cellData) => {
        expect(cellData).to.eq(data.specialChars);
      });
      table.ReadTableRowColumnData(0, 4, "v2").then((cellData) => {
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
      table.WaitUntilTableLoad(0, 0, "v2");
    });

    it("5. Generate CRUD page from entity explorer and verify", () => {
      // Adding pafe with data from entity explorer
      PageList.AddNewPage("Generate page with data");

      // Select the datasource, spreadsheet and sheet name
      agHelper.GetNClick(dataSources._selectDatasourceDropdown);
      agHelper.GetNClick(locators._visibleTextSpan(dataSourceName), 0, true);
      agHelper.AssertElementAbsence(
        locators._btnSpinner,
        Cypress.config("defaultCommandTimeout"),
      );
      agHelper.GetNClick(dataSources._selectTableDropdown, 0, true);
      agHelper.GetNClickByContains(
        dataSources._dropdownOption,
        spreadSheetName,
        0,
        true,
      );
      agHelper.AssertElementAbsence(
        locators._btnSpinner,
        Cypress.config("defaultCommandTimeout"),
      );
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
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.TABLE));
      const data = GSHEET_DATA.filter((item) => item.rowIndex === "1")[0];
      table.ReadTableRowColumnData(1, 0, "v2").then((cellData) => {
        expect(cellData).to.eq(data.uniq_id);
      });
      table.ReadTableRowColumnData(1, 1, "v2").then((cellData) => {
        expect(cellData).to.eq(data.japanese_name);
      });
      table.ReadTableRowColumnData(1, 2, "v2").then((cellData) => {
        expect(cellData).to.eq(data.currencies);
      });
      table.ReadTableRowColumnData(1, 3, "v2").then((cellData) => {
        expect(cellData).to.eq(data.specialChars);
      });
      table.ReadTableRowColumnData(1, 5, "v2").then((cellData) => {
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
      table.WaitUntilTableLoad(0, 0, "v2");
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

    after("Delete spreadsheet and app", function () {
      // Delete spreadsheet and app
      homePage.NavigateToHome();
      homePage.EditAppFromAppHover(appName);
      gsheetHelper.DeleteSpreadsheetQuery(dataSourceName, spreadSheetName);
      cy.get("@postExecute", {
        timeout: Cypress.config("pageLoadTimeout"),
      }).then((interception: any) => {
        expect(interception.response.body.data.body.message).to.deep.equal(
          "Deleted spreadsheet successfully!",
        );
      });
      homePage.NavigateToHome();
      homePage.DeleteApplication(appName);
    });
  },
);
