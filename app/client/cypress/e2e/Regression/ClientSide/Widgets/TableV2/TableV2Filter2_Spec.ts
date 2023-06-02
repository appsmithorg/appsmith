import * as _ from "../../../../../support/Objects/ObjectsCore";

let dataSet: any;

describe("Verify various Table_Filter combinations", function () {
  before(() => {
    cy.fixture("example").then(function (data: any) {
      dataSet = data;
    });
  });

  it("1. Adding Data to Table Widget", function () {
    _.entityExplorer.DragDropWidgetNVerify("tablewidgetv2", 650, 250);
    //_.propPane.EnterJSContext("Table data", JSON.stringify(dataSet.TableInput));
    _.table.AddSampleTableData();
    //_.propPane.EnterJSContext("Table Data", JSON.stringify(dataSet.TableInput));
    _.propPane.UpdatePropertyFieldValue(
      "Table data",
      JSON.stringify(dataSet.TableInput),
    );
    _.agHelper.ValidateNetworkStatus("@updateLayout", 200);
    _.agHelper.PressEscape();
    /*
      Changing id and orderAmount to "Plain Text" column type
      so that the tests that depend on id and orderAmount
      being "Plain Text" type do not fail.
      From this PR onwards columns with number data (like id and orderAmount here)
      will be auto-assigned as "NUMBER" type column
    */
    _.table.ChangeColumnType("id", "Plain text", "v2");
    _.table.ChangeColumnType("orderAmount", "Plain text", "v2");

    _.deployMode.DeployApp();
  });

  it("2. Verify Table Filter for AND operator - same row match - Where Edit - input value", function () {
    _.table.ReadTableRowColumnData(0, 3, "v2").then(($cellData) => {
      expect($cellData).to.eq("Michael Lawson");
    });
    _.table.OpenNFilterTable("userName", "ends with", "s");
    _.table.ReadTableRowColumnData(1, 3, "v2").then(($cellData) => {
      expect($cellData).to.eq("Ryan Holmes");
    });
    _.table.OpenNFilterTable("orderAmount", "is exactly", "4.99", "AND", 1);
    _.table.ReadTableRowColumnData(0, 3, "v2").then(($cellData) => {
      expect($cellData).to.eq("Byron Fields");
    });
    _.agHelper
      .GetNClick(_.table._filterInputValue, 1)
      .clear()
      .type("7.99")
      .wait(500);
    _.agHelper.ClickButton("APPLY");
    _.table.ReadTableRowColumnData(0, 3, "v2").then(($cellData) => {
      expect($cellData).to.eq("Ryan Holmes");
    });
    _.table.RemoveFilterNVerify("2381224", true, false, 0, "v2");
  });

  it("3. Verify Table Filter for AND operator - two 'ANDs' - clearAll", function () {
    _.table.ReadTableRowColumnData(0, 3, "v2").then(($cellData) => {
      expect($cellData).to.eq("Michael Lawson");
    });
    _.table.OpenNFilterTable("id", "contains", "7434532");
    _.table.ReadTableRowColumnData(1, 3, "v2").then(($cellData) => {
      expect($cellData).to.eq("Ryan Holmes");
    });
    _.table.OpenNFilterTable("productName", "contains", "i", "AND", 1);
    _.table.ReadTableRowColumnData(0, 3, "v2").then(($cellData) => {
      expect($cellData).to.eq("Byron Fields");
    });
    _.table.OpenNFilterTable("orderAmount", "starts with", "7", "AND", 2);
    _.table.ReadTableRowColumnData(0, 3, "v2").then(($cellData) => {
      expect($cellData).to.eq("Ryan Holmes");
    });
    _.table.RemoveFilterNVerify("2381224", true, false, 0, "v2");
  });

  it("4. Verify Table Filter for AND operator - two 'ANDs' - removeOne filter condition + Bug 12638", function () {
    _.table.OpenNFilterTable("id", "contains", "2");
    _.table.ReadTableRowColumnData(1, 3, "v2").then(($cellData) => {
      expect($cellData).to.eq("Lindsay Ferguson");
    });
    _.table.OpenNFilterTable("productName", "ends with", "WICH", "AND", 1);
    _.table.ReadTableRowColumnData(0, 3, "v2").then(($cellData) => {
      expect($cellData).to.eq("Michael Lawson");
    });
    _.table.OpenNFilterTable("userName", "does not contain", "son", "AND", 2);
    _.table.ReadTableRowColumnData(0, 3, "v2").then(($cellData) => {
      expect($cellData).to.eq("Byron Fields");
    });
    _.table.RemoveFilterNVerify("7434532", false, true, 1, "v2");
    //Bug 12638
    _.table.ReadTableRowColumnData(1, 3, "v2").then(($cellData) => {
      expect($cellData).to.eq("Ryan Holmes");
    });
    _.table.RemoveFilterNVerify("2381224", true, false, 0, "v2");
  });

  it("5. Verify Table Filter for AND operator - two 'ANDs' - removeOne filter twice + Bug 12638", function () {
    _.table.OpenNFilterTable("id", "starts with", "2");
    _.table.ReadTableRowColumnData(1, 3, "v2").then(($cellData) => {
      expect($cellData).to.eq("Lindsay Ferguson");
    });
    _.table.OpenNFilterTable("productName", "ends with", "WICH", "AND", 1);
    _.table.ReadTableRowColumnData(0, 3, "v2").then(($cellData) => {
      expect($cellData).to.eq("Michael Lawson");
    });
    _.table.OpenNFilterTable("userName", "contains", "on", "AND", 2);
    _.table.ReadTableRowColumnData(0, 3, "v2").then(($cellData) => {
      expect($cellData).to.eq("Michael Lawson");
    });
    _.table.RemoveFilterNVerify("2381224", false, true, 1, "v2");
    _.table.RemoveFilterNVerify("2381224", false, true, 0, "v2");

    //Bug 12638 - verification to add here - once closed

    _.table.ReadTableRowColumnData(1, 3, "v2").then(($cellData) => {
      expect($cellData).to.eq("Lindsay Ferguson");
    });
    _.table.RemoveFilterNVerify("2381224", true, false, 0, "v2");
  });

  it("6. Verify Table Filter for changing from AND -> OR -> AND", function () {
    _.table.OpenNFilterTable("id", "contains", "7");
    _.table.ReadTableRowColumnData(1, 4, "v2").then(($cellData) => {
      expect($cellData).to.eq("Beef steak");
    });
    _.table.OpenNFilterTable("productName", "contains", "I", "AND", 1);
    _.table.ReadTableRowColumnData(1, 4, "v2").then(($cellData) => {
      expect($cellData).to.eq("Avocado Panini");
    });
    _.table.OpenNFilterTable("userName", "starts with", "r", "AND", 2);
    _.table.ReadTableRowColumnData(0, 4, "v2").then(($cellData) => {
      expect($cellData).to.eq("Avocado Panini");
    });

    _.agHelper.GetNClick(_.table._filterOperatorDropdown);
    cy.get(_.table._dropdownText).contains("OR").click();
    _.agHelper.ClickButton("APPLY");

    _.table.ReadTableRowColumnData(1, 4, "v2").then(($cellData) => {
      expect($cellData).to.eq("Tuna Salad");
    });

    _.agHelper.GetNClick(_.table._filterOperatorDropdown);
    cy.get(_.table._dropdownText).contains("AND").click();
    _.agHelper.ClickButton("APPLY");

    _.table.ReadTableRowColumnData(0, 4, "v2").then(($cellData) => {
      expect($cellData).to.eq("Avocado Panini");
    });
    _.table.RemoveFilterNVerify("2381224", true, false, 0, "v2");
  });

  it("7. Verify Table Filter for changing from AND -> OR -> along with changing Where clause condions", function () {
    _.table.OpenNFilterTable("id", "starts with", "2");
    _.table.ReadTableRowColumnData(0, 3, "v2").then(($cellData) => {
      expect($cellData).to.eq("Michael Lawson");
    });
    _.table.ReadTableRowColumnData(1, 3, "v2", 200).then(($cellData) => {
      expect($cellData).to.eq("Lindsay Ferguson");
    });

    _.table.OpenNFilterTable("orderAmount", "contains", "19", "OR", 1);
    _.table.ReadTableRowColumnData(2, 3, "v2").then(($cellData) => {
      expect($cellData).to.eq("Tobias Funke");
    });

    //Changing filter conditions of both where rows - 1st row
    _.agHelper
      .GetNClick(_.table._filterInputValue, 0)
      .clear()
      .type("7")
      .wait(500);
    _.agHelper.ClickButton("APPLY");
    _.table.ReadTableRowColumnData(0, 3, "v2").then(($cellData) => {
      expect($cellData).to.eq("Tobias Funke");
    });
    _.table.ReadTableRowColumnData(1, 3, "v2", 200).then(($cellData) => {
      expect($cellData).to.eq("Byron Fields");
    });
    _.table.ReadTableRowColumnData(2, 3, "v2", 200).then(($cellData) => {
      expect($cellData).to.eq("Ryan Holmes");
    });

    //Changing filter conditions of both where rows - 2nd row
    _.agHelper.GetNClick(_.table._filterConditionDropdown, 1);
    cy.get(_.table._dropdownText).contains("does not contain").click();
    _.agHelper.ClickButton("APPLY");
    _.table.ReadTableRowColumnData(0, 3, "v2").then(($cellData) => {
      expect($cellData).to.eq("Michael Lawson");
    });
    _.table.ReadTableRowColumnData(1, 3, "v2", 200).then(($cellData) => {
      expect($cellData).to.eq("Lindsay Ferguson");
    });
    _.table.ReadTableRowColumnData(2, 3, "v2", 200).then(($cellData) => {
      expect($cellData).to.eq("Byron Fields");
    });
    _.table.ReadTableRowColumnData(3, 3, "v2", 200).then(($cellData) => {
      expect($cellData).to.eq("Ryan Holmes");
    });

    //Changing OR to AND
    _.agHelper.GetNClick(_.table._filterOperatorDropdown);
    cy.get(_.table._dropdownText).contains("AND").click();
    _.agHelper.ClickButton("APPLY");
    _.table.ReadTableRowColumnData(0, 3, "v2").then(($cellData) => {
      expect($cellData).to.eq("Byron Fields");
    });
    _.table.ReadTableRowColumnData(1, 3, "v2", 200).then(($cellData) => {
      expect($cellData).to.eq("Ryan Holmes");
    });

    //Changing AND to OR
    _.agHelper.GetNClick(_.table._filterOperatorDropdown);
    cy.get(_.table._dropdownText).contains("OR").click();
    _.agHelper.GetNClick(_.table._filterConditionDropdown, 1);
    cy.get(_.table._dropdownText).contains("starts with").click();
    _.agHelper
      .GetNClick(_.table._filterInputValue, 1)
      .clear()
      .type("9")
      .wait(500);
    _.agHelper.ClickButton("APPLY");
    _.table.ReadTableRowColumnData(0, 3, "v2").then(($cellData) => {
      expect($cellData).to.eq("Lindsay Ferguson");
    });
    _.table.ReadTableRowColumnData(1, 3, "v2", 200).then(($cellData) => {
      expect($cellData).to.eq("Byron Fields");
    });
    _.table.ReadTableRowColumnData(2, 3, "v2", 200).then(($cellData) => {
      expect($cellData).to.eq("Ryan Holmes");
    });
    _.table.RemoveFilterNVerify("2381224", true, false, 0, "v2");
  });

  //Skipping until bug closed
  it.skip("8. Verify Table Filter for changing from AND -> OR [Remove a filter] -> AND + Bug 12642", function () {
    _.table.OpenNFilterTable("id", "contains", "7");
    _.table.ReadTableRowColumnData(1, 4, "v2").then(($cellData) => {
      expect($cellData).to.eq("Beef steak");
    });
    _.table.OpenNFilterTable("productName", "contains", "I", "AND", 1);
    _.table.ReadTableRowColumnData(1, 4, "v2").then(($cellData) => {
      expect($cellData).to.eq("Avocado Panini");
    });
    _.table.OpenNFilterTable("userName", "starts with", "r", "AND", 2);
    _.table.ReadTableRowColumnData(0, 4, "v2").then(($cellData) => {
      expect($cellData).to.eq("Avocado Panini");
    });

    _.agHelper.GetNClick(_.table._filterOperatorDropdown);
    cy.get(_.table._dropdownText).contains("OR").click();
    _.agHelper.ClickButton("APPLY");

    _.table.ReadTableRowColumnData(1, 4, "v2").then(($cellData) => {
      expect($cellData).to.eq("Tuna Salad");
    });

    _.table.RemoveFilterNVerify("2381224", false, true, 0, "v2"); //Verifies bug 12642

    _.agHelper.GetNClick(_.table._filterOperatorDropdown);
    cy.get(_.table._dropdownText).contains("AND").click();
    _.agHelper.ClickButton("APPLY");

    _.table.ReadTableRowColumnData(0, 4, "v2").then(($cellData) => {
      expect($cellData).to.eq("Avocado Panini");
    });
    _.table.RemoveFilterNVerify("2381224", true, false, 0, "v2");
  });

  it("9. Verify Full table data - download csv and download Excel", function () {
    _.table.DownloadFromTable("Download as CSV");
    //This plugin works only from cypress ^9.2
    //cy.verifyDownload("Table1.csv")
    _.table.ValidateDownloadNVerify("Table1.csv", "Michael Lawson");

    _.table.DownloadFromTable("Download as Excel");
    _.table.ValidateDownloadNVerify("Table1.xlsx", "Michael Lawson");
  });

  it("10. Verify Searched data - download csv and download Excel", function () {
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

  it("11. Verify Filtered data - download csv and download Excel", function () {
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

  it("12. Import TableFilter application & verify all filters for same FirstName (one word column) + Bug 13334", () => {
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
    filterOnlyCondition("starts with", "1");

    // Ends with - Open Bug 13334
    filterOnlyCondition("ends with", "1");

    filterOnlyCondition("is exactly", "1");
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
    _.table.RemoveFilterNVerify("1", true, false, 0, "v2");
  });

  it("13. Verify all filters for same FullName (two word column) + Bug 13334", () => {
    //Contains
    _.table.OpenNFilterTable("FullName", "contains", "torres");
    _.table.ReadTableRowColumnData(0, 2, "v2").then(($cellData) => {
      expect($cellData).to.eq("Virgie");
    });

    filterOnlyCondition("does not contain", "49");
    filterOnlyCondition("starts with", "0");
    filterOnlyCondition("ends with", "1");
    filterOnlyCondition("is exactly", "0");
    filterOnlyCondition("empty", "0");
    filterOnlyCondition("not empty", "50");
    filterOnlyCondition("contains", "1", "wolf");
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
      .then(($count) => expect($count).contain("10"));
    _.table.CloseFilter();
    _.agHelper
      .GetText(_.table._filtersCount)
      .then(($count) => expect($count).contain("3"));

    _.table.OpenFilter();
    _.table.RemoveFilterNVerify("1", true, false, 0, "v2");
  });

  it("14. Verify Table Filter for correct value in filter value input after removing second filter - Bug 12638", function () {
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

  it("15. Verify Table Filter operator for correct value after removing where clause condition - Bug 12642", function () {
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
