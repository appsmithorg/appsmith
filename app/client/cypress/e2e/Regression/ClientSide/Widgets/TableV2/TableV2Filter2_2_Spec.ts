import * as _ from "../../../../../support/Objects/ObjectsCore";

describe("Verify various Table_Filter combinations", function () {
  it("1. Verify Full table data - download csv and download Excel", function () {
    _.table.DownloadFromTable("Download as CSV");
    //This plugin works only from cypress ^9.2
    //cy.verifyDownload("Table1.csv")
    _.table.ValidateDownloadNVerify("Table1.csv", "Michael Lawson");

    _.table.DownloadFromTable("Download as Excel");
    _.table.ValidateDownloadNVerify("Table1.xlsx", "Michael Lawson");
  });

  it("2. Verify Searched data - download csv and download Excel", function () {
    _.table.SearchTable("7434532");
    _.table.ReadTableRowColumnData(0, 3, "v2").then((afterSearch) => {
      expect(afterSearch).to.eq("Byron Fields");
    });

    _.table.DownloadFromTable("Download as CSV");
    //This plugin works only from cypress ^9.2
    //cy.verifyDownload("Table1.csv")
    _.table.ValidateDownloadNVerify("Table1.csv", "byron.fields@reqres.in");

    _.table.DownloadFromTable("Download as Excel");
    _.table.ValidateDownloadNVerify("Table1.xlsx", "Ryan Holmes");

    _.table.RemoveSearchTextNVerify("2381224", "v2");

    _.table.DownloadFromTable("Download as CSV");
    _.table.ValidateDownloadNVerify("Table1.csv", "2736212");

    _.table.DownloadFromTable("Download as Excel");
    _.table.ValidateDownloadNVerify("Table1.xlsx", "Beef steak");
  });

  it("3. Verify Filtered data - download csv and download Excel", function () {
    _.table.OpenNFilterTable("id", "starts with", "6");
    _.table.ReadTableRowColumnData(0, 3, "v2").then(($cellData) => {
      expect($cellData).to.eq("Tobias Funke");
    });
    _.table.CloseFilter();

    _.table.DownloadFromTable("Download as CSV");
    //This plugin works only from cypress ^9.2
    //cy.verifyDownload("Table1.csv")
    _.table.ValidateDownloadNVerify("Table1.csv", "Beef steak");

    _.table.DownloadFromTable("Download as Excel");
    _.table.ValidateDownloadNVerify("Table1.xlsx", "tobias.funke@reqres.in");

    _.agHelper.GetNClick(_.table._filterBtn);
    _.table.RemoveFilterNVerify("2381224", true, false, 0, "v2");

    _.table.DownloadFromTable("Download as CSV");
    _.table.ValidateDownloadNVerify("Table1.csv", "Tuna Salad");

    _.table.DownloadFromTable("Download as Excel");
    _.table.ValidateDownloadNVerify("Table1.xlsx", "Avocado Panini");
  });

  it("4. Import TableFilter application & verify all filters for same FirstName (one word column) + Bug 13334", () => {
    _.deployMode.NavigateBacktoEditor();
    _.table.WaitUntilTableLoad(0, 0, "v2");
    _.homePage.NavigateToHome();
    _.homePage.ImportApp("Table/TableFilterImportApp.json");
    _.homePage.AssertImportToast();
    _.deployMode.DeployApp();
    _.table.WaitUntilTableLoad(0, 0, "v2");

    //Contains
    _.table.OpenNFilterTable("FirstName", "contains", "Della");
    _.table.ReadTableRowColumnData(0, 3, "v2").then(($cellData) => {
      expect($cellData).to.eq("Alvarado");
    });

    filterOnlyCondition("does not contain", "49");
    filterOnlyCondition("starts with", "");

    // Ends with - Open Bug 13334
    filterOnlyCondition("ends with", "");

    filterOnlyCondition("is exactly", "");
    filterOnlyCondition("empty", "0");
    filterOnlyCondition("not empty", "50");
    filterOnlyCondition("starts with", "3", "ge");
    _.table.ReadTableRowColumnData(0, 3, "v2").then(($cellData) => {
      expect($cellData).to.eq("Chandler");
    });

    _.table.OpenNFilterTable("FullName", "ends with", "ross", "OR", 1);
    _.agHelper
      .GetText(_.table._showPageItemsCount)
      .then(($count) => expect($count).contain("4"));
    _.table.CloseFilter();
    _.agHelper
      .GetText(_.table._filtersCount)
      .then(($count) => expect($count).contain("2"));

    _.table.OpenFilter();
    _.table.RemoveFilterNVerify("", true, false, 0, "v2");
  });

  it("5. Verify all filters for same FullName (two word column) + Bug 13334", () => {
    //Contains
    _.table.OpenNFilterTable("FullName", "contains", "torres");
    _.table.ReadTableRowColumnData(0, 2, "v2").then(($cellData) => {
      expect($cellData).to.eq("Virgie");
    });

    filterOnlyCondition("does not contain", "49");
    filterOnlyCondition("starts with", "0");
    filterOnlyCondition("ends with", "");
    filterOnlyCondition("is exactly", "0");
    filterOnlyCondition("empty", "0");
    filterOnlyCondition("not empty", "50");
    filterOnlyCondition("contains", "", "wolf");
    _.table.ReadTableRowColumnData(0, 2, "v2").then(($cellData) => {
      expect($cellData).to.eq("Teresa");
    });

    _.table.OpenNFilterTable("FirstName", "starts with", "wa", "OR", 1);
    _.agHelper.Sleep();
    _.agHelper
      .GetText(_.table._showPageItemsCount)
      .then(($count) => expect($count).contain("3"));

    _.table.OpenNFilterTable("LastName", "ends with", "son", "OR", 2);
    _.agHelper
      .GetText(_.table._showPageItemsCount)
      .then(($count) => expect($count).contain("0"));
    _.table.CloseFilter();
    _.agHelper
      .GetText(_.table._filtersCount)
      .then(($count) => expect($count).contain("3"));

    _.table.OpenFilter();
    _.table.RemoveFilterNVerify("", true, false, 0, "v2");
  });

  it("6. Verify Table Filter for correct value in filter value input after removing second filter - Bug 12638", function () {
    _.table.OpenNFilterTable("seq", "greater than", "5");

    _.table.OpenNFilterTable("FirstName", "contains", "r", "AND", 1);

    _.table.OpenNFilterTable("LastName", "contains", "son", "AND", 2);
    _.agHelper.GetNClick(".t--table-filter-remove-btn", 1);
    cy.wait(500);
    cy.get(
      ".t--table-filter:nth-child(2) .t--table-filter-value-input input[type=text]",
    ).should("have.value", "son");
    _.agHelper.GetNClick(".t--clear-all-filter-btn");
    _.agHelper.GetNClick(".t--close-filter-btn");
  });

  it("7. Verify Table Filter operator for correct value after removing where clause condition - Bug 12642", function () {
    _.table.OpenNFilterTable("seq", "greater than", "5");

    _.table.OpenNFilterTable("FirstName", "contains", "r", "AND", 1);

    _.table.OpenNFilterTable("LastName", "contains", "son", "AND", 2);
    _.agHelper.GetNClick(".t--table-filter-operators-dropdown");
    cy.get(".t--dropdown-option").contains("OR").click();
    _.agHelper.GetNClick(".t--table-filter-remove-btn", 0);
    cy.get(".t--table-filter-operators-dropdown div div span").should(
      "contain",
      "OR",
    );
    _.agHelper.GetNClick(".t--clear-all-filter-btn");
  });

  function filterOnlyCondition(
    condition: string,
    expectedCount: string,
    input: string | "" = "",
  ) {
    _.agHelper.GetNClick(_.table._filterConditionDropdown);
    cy.get(_.table._dropdownText).contains(condition).click();
    if (input)
      _.agHelper.GetNClick(_.table._filterInputValue, 0).type(input).wait(500);
    _.agHelper.ClickButton("APPLY");
    _.agHelper
      .GetText(_.table._showPageItemsCount)
      .then(($count) => expect($count).contain(expectedCount));
  }
});
