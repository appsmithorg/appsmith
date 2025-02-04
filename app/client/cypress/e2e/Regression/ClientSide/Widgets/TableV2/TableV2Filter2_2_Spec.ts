import {
  entityExplorer,
  propPane,
  deployMode,
  table,
  assertHelper,
  locators,
  draggableWidgets,
  agHelper,
  homePage,
} from "../../../../../support/Objects/ObjectsCore";

describe(
  "Verify various Table_Filter combinations",
  { tags: ["@tag.Widget", "@tag.Table", "@tag.Binding"] },
  function () {
    it("1. Verify Full table data - download csv and download Excel", function () {
      entityExplorer.DragDropWidgetNVerify("tablewidgetv2", 650, 250);
      // turn on filtering for the table - it is disabled by default in this PR(#34593)
      propPane.ExpandIfCollapsedSection("search\\&filters");
      agHelper.GetNClick(".t--property-control-allowfiltering input");
      table.AddSampleTableData();
      propPane.UpdatePropertyFieldValue(
        "Table data",
        JSON.stringify(this.dataSet.TableInput),
      );
      assertHelper.AssertNetworkStatus("@updateLayout", 200);
      agHelper.PressEscape();
      table.ChangeColumnType("id", "Plain text", "v2");
      table.ChangeColumnType("orderAmount", "Plain text", "v2");
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.TABLE));
      table.WaitUntilTableLoad(0, 0, "v2");

      table.DownloadFromTable("Download as CSV");
      //This plugin works only from cypress ^9.2
      //cy.verifyDownload("Table1.csv")
      table.ValidateDownloadNVerify("Table1.csv", "Michael Lawson");

      // @rahulbarwal temporarily commenting download as excel feature till we have a proper fix to the issue: https://github.com/appsmithorg/appsmith/issues/38995
      // table.DownloadFromTable("Download as Excel");
      // table.ValidateDownloadNVerify("Table1.xlsx", "Michael Lawson");
    });

    it("2. Verify Searched data - download csv and download Excel", function () {
      table.SearchTable("7434532");
      table.ReadTableRowColumnData(0, 3, "v2").then((afterSearch) => {
        expect(afterSearch).to.eq("Byron Fields");
      });

      table.DownloadFromTable("Download as CSV");
      //This plugin works only from cypress ^9.2
      //cy.verifyDownload("Table1.csv")
      table.ValidateDownloadNVerify("Table1.csv", "byron.fields@reqres.in");

      // @rahulbarwal temporarily commenting download as excel feature till we have a proper fix to the issue: https://github.com/appsmithorg/appsmith/issues/38995
      // table.DownloadFromTable("Download as Excel");
      // table.ValidateDownloadNVerify("Table1.xlsx", "Ryan Holmes");

      table.RemoveSearchTextNVerify("2381224", "v2");

      table.DownloadFromTable("Download as CSV");
      table.ValidateDownloadNVerify("Table1.csv", "2736212");

      // @rahulbarwal temporarily commenting download as excel feature till we have a proper fix to the issue: https://github.com/appsmithorg/appsmith/issues/38995
      // table.DownloadFromTable("Download as Excel");
      // table.ValidateDownloadNVerify("Table1.xlsx", "Beef steak");
    });

    it("3. Verify Filtered data - download csv and download Excel", function () {
      table.OpenNFilterTable("id", "starts with", "6");
      table.ReadTableRowColumnData(0, 3, "v2").then(($cellData) => {
        expect($cellData).to.eq("Tobias Funke");
      });
      table.CloseFilter();

      table.DownloadFromTable("Download as CSV");
      //This plugin works only from cypress ^9.2
      //cy.verifyDownload("Table1.csv")
      table.ValidateDownloadNVerify("Table1.csv", "Beef steak");

      // @rahulbarwal temporarily commenting download as excel feature till we have a proper fix to the issue: https://github.com/appsmithorg/appsmith/issues/38995
      // table.DownloadFromTable("Download as Excel");
      // table.ValidateDownloadNVerify("Table1.xlsx", "tobias.funke@reqres.in");

      agHelper.GetNClick(table._filterBtn);
      table.RemoveFilterNVerify("2381224", true, false, 0, "v2");

      table.DownloadFromTable("Download as CSV");
      table.ValidateDownloadNVerify("Table1.csv", "Tuna Salad");

      // @rahulbarwal temporarily commenting download as excel feature till we have a proper fix to the issue: https://github.com/appsmithorg/appsmith/issues/38995
      // table.DownloadFromTable("Download as Excel");
      // table.ValidateDownloadNVerify("Table1.xlsx", "Avocado Panini");
    });

    it("4. Import TableFilter application & verify all filters for same FirstName (one word column) + Bug 13334", () => {
      deployMode.NavigateBacktoEditor();
      table.WaitUntilTableLoad(0, 0, "v2");
      homePage.NavigateToHome();
      homePage.ImportApp("Table/TableV2FilterImportApp.json");
      homePage.AssertImportToast();
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.TABLE));
      table.WaitUntilTableLoad(0, 0, "v2");

      //Contains
      table.OpenNFilterTable("FirstName", "contains", "Della");
      table.ReadTableRowColumnData(0, 3, "v2").then(($cellData) => {
        expect($cellData).to.eq("Alvarado");
      });

      filterOnlyCondition("does not contain", "49");
      filterOnlyCondition("starts with", "1");

      // Ends with - Open Bug 13334
      filterOnlyCondition("ends with", "1");

      filterOnlyCondition("is exactly", "1");
      filterOnlyCondition("empty", "0");
      filterOnlyCondition("not empty", "50");
      filterOnlyCondition("starts with", "3", "ge");
      table.ReadTableRowColumnData(0, 3, "v2").then(($cellData) => {
        expect($cellData).to.eq("Chandler");
      });

      table.OpenNFilterTable("FullName", "ends with", "ross", "OR", 1);
      agHelper
        .GetText(table._showPageItemsCount)
        .then(($count) => expect($count).contain("4"));
      table.CloseFilter();
      agHelper
        .GetText(table._filtersCount)
        .then(($count) => expect($count).contain("2"));

      table.OpenFilter();
      table.RemoveFilterNVerify("1", true, false, 0, "v2");
    });

    it("5. Verify all filters for same FullName (two word column) + Bug 13334", () => {
      //Contains
      table.OpenNFilterTable("FullName", "contains", "torres");
      table.ReadTableRowColumnData(0, 2, "v2").then(($cellData) => {
        expect($cellData).to.eq("Virgie");
      });

      filterOnlyCondition("does not contain", "49");
      filterOnlyCondition("starts with", "0");
      filterOnlyCondition("ends with", "1");
      filterOnlyCondition("is exactly", "0");
      filterOnlyCondition("empty", "0");
      filterOnlyCondition("not empty", "50");
      filterOnlyCondition("contains", "1", "wolf");
      table.ReadTableRowColumnData(0, 2, "v2").then(($cellData) => {
        expect($cellData).to.eq("Teresa");
      });

      table.OpenNFilterTable("FirstName", "starts with", "wa", "OR", 1);
      agHelper.Sleep();
      agHelper
        .GetText(table._showPageItemsCount)
        .then(($count) => expect($count).contain("3"));

      table.OpenNFilterTable("LastName", "ends with", "son", "OR", 2);
      agHelper
        .GetText(table._showPageItemsCount)
        .then(($count) => expect($count).contain("0"));
      table.CloseFilter();
      agHelper
        .GetText(table._filtersCount)
        .then(($count) => expect($count).contain("3"));

      table.OpenFilter();
      table.RemoveFilterNVerify("1", true, false, 0, "v2");
    });

    it("6. Verify Table Filter for correct value in filter value input after removing second filter - Bug 12638", function () {
      table.OpenNFilterTable("seq", "greater than", "5");

      table.OpenNFilterTable("FirstName", "contains", "r", "AND", 1);

      table.OpenNFilterTable("LastName", "contains", "son", "AND", 2);
      agHelper.GetNClick(".t--table-filter-remove-btn", 1);
      cy.wait(500);
      cy.get(
        ".t--table-filter:nth-child(2) .t--table-filter-value-input input[type=text]",
      ).should("have.value", "son");
      agHelper.GetNClick(".t--clear-all-filter-btn");
      agHelper.GetNClick(".t--close-filter-btn");
    });

    it("7. Verify Table Filter operator for correct value after removing where clause condition - Bug 12642", function () {
      table.OpenNFilterTable("seq", "greater than", "5");

      table.OpenNFilterTable("FirstName", "contains", "r", "AND", 1);

      table.OpenNFilterTable("LastName", "contains", "son", "AND", 2);
      agHelper.GetNClick(".t--table-filter-operators-dropdown");
      cy.get(".t--dropdown-option").contains("OR").click();
      agHelper.GetNClick(".t--table-filter-remove-btn", 0);
      cy.get(".t--table-filter-operators-dropdown div div span").should(
        "contain",
        "OR",
      );
      agHelper.GetNClick(".t--clear-all-filter-btn");
    });

    function filterOnlyCondition(
      condition: string,
      expectedCount: string,
      input: string | "" = "",
    ) {
      agHelper.GetNClick(table._filterConditionDropdown);
      cy.get(table._dropdownText).contains(condition).click();
      if (input)
        agHelper.GetNClick(table._filterInputValue, 0).type(input).wait(500);
      agHelper.ClickButton("APPLY");
      agHelper
        .GetText(table._showPageItemsCount)
        .then(($count) => expect($count).contain(expectedCount));
    }
  },
);
