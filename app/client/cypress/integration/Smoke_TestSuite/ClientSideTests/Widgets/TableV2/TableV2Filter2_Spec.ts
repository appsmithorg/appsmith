import { ObjectsRegistry } from "../../../../../support/Objects/Registry";

let dataSet: any;
const agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  table = ObjectsRegistry.TableV2,
  homePage = ObjectsRegistry.HomePage,
  deployMode = ObjectsRegistry.DeployMode,
  propPane = ObjectsRegistry.PropertyPane;

describe("Verify various Table_Filter combinations", function() {
  before(() => {
    cy.fixture("example").then(function(data: any) {
      dataSet = data;
    });
  });

  it("1. Adding Data to Table Widget", function() {
    ee.DragDropWidgetNVerify("tablewidgetv2", 250, 250);
    //propPane.EnterJSContext("Table Data", JSON.stringify(dataSet.TableInput));
    propPane.UpdatePropertyFieldValue(
      "Table Data",
      JSON.stringify(dataSet.TableInput),
    );
    agHelper.ValidateNetworkStatus("@updateLayout", 200);
    agHelper.PressEscape();
    deployMode.DeployApp();
  });

  it("2. Verify Table Filter for AND operator - same row match - Where Edit - input value", function() {
    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Michael Lawson");
    });
    table.OpenNFilterTable("userName", "ends with", "s");
    table.ReadTableRowColumnData(1, 3).then(($cellData) => {
      expect($cellData).to.eq("Ryan Holmes");
    });
    table.OpenNFilterTable("orderAmount", "is exactly", "4.99", "AND", 1);
    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Byron Fields");
    });
    agHelper
      .GetNClick(table._filterInputValue, 1)
      .clear()
      .type("7.99")
      .wait(500);
    agHelper.ClickButton("APPLY");
    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Ryan Holmes");
    });
    table.RemoveFilterNVerify("2381224", true, false);
  });

  it("3. Verify Table Filter for AND operator - two 'ANDs' - clearAll", function() {
    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Michael Lawson");
    });
    table.OpenNFilterTable("id", "contains", "7434532");
    table.ReadTableRowColumnData(1, 3).then(($cellData) => {
      expect($cellData).to.eq("Ryan Holmes");
    });
    table.OpenNFilterTable("productName", "contains", "i", "AND", 1);
    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Byron Fields");
    });
    table.OpenNFilterTable("orderAmount", "starts with", "7", "AND", 2);
    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Ryan Holmes");
    });
    table.RemoveFilterNVerify("2381224", true, false);
  });

  it("4. Verify Table Filter for AND operator - two 'ANDs' - removeOne filter condition + Bug 12638", function() {
    table.OpenNFilterTable("id", "contains", "2");
    table.ReadTableRowColumnData(1, 3).then(($cellData) => {
      expect($cellData).to.eq("Lindsay Ferguson");
    });
    table.OpenNFilterTable("productName", "ends with", "WICH", "AND", 1);
    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Michael Lawson");
    });
    table.OpenNFilterTable("userName", "does not contain", "son", "AND", 2);
    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Byron Fields");
    });
    table.RemoveFilterNVerify("7434532", false, true, 1);
    //Bug 12638
    table.ReadTableRowColumnData(1, 3).then(($cellData) => {
      expect($cellData).to.eq("Ryan Holmes");
    });
    table.RemoveFilterNVerify("2381224", true, false);
  });

  it("5. Verify Table Filter for AND operator - two 'ANDs' - removeOne filter twice + Bug 12638", function() {
    table.OpenNFilterTable("id", "starts with", "2");
    table.ReadTableRowColumnData(1, 3).then(($cellData) => {
      expect($cellData).to.eq("Lindsay Ferguson");
    });
    table.OpenNFilterTable("productName", "ends with", "WICH", "AND", 1);
    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Michael Lawson");
    });
    table.OpenNFilterTable("userName", "contains", "on", "AND", 2);
    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Michael Lawson");
    });
    table.RemoveFilterNVerify("2381224", false, true, 1);
    table.RemoveFilterNVerify("2381224", false, true, 0);

    //Bug 12638 - verification to add here - once closed

    table.ReadTableRowColumnData(1, 3).then(($cellData) => {
      expect($cellData).to.eq("Lindsay Ferguson");
    });
    table.RemoveFilterNVerify("2381224", true, false);
  });

  it("6. Verify Table Filter for changing from AND -> OR -> AND", function() {
    table.OpenNFilterTable("id", "contains", "7");
    table.ReadTableRowColumnData(1, 4).then(($cellData) => {
      expect($cellData).to.eq("Beef steak");
    });
    table.OpenNFilterTable("productName", "contains", "I", "AND", 1);
    table.ReadTableRowColumnData(1, 4).then(($cellData) => {
      expect($cellData).to.eq("Avocado Panini");
    });
    table.OpenNFilterTable("userName", "starts with", "r", "AND", 2);
    table.ReadTableRowColumnData(0, 4).then(($cellData) => {
      expect($cellData).to.eq("Avocado Panini");
    });

    agHelper.GetNClick(table._filterOperatorDropdown);
    cy.get(table._dropdownText)
      .contains("OR")
      .click();
    agHelper.ClickButton("APPLY");

    table.ReadTableRowColumnData(1, 4).then(($cellData) => {
      expect($cellData).to.eq("Tuna Salad");
    });

    agHelper.GetNClick(table._filterOperatorDropdown);
    cy.get(table._dropdownText)
      .contains("AND")
      .click();
    agHelper.ClickButton("APPLY");

    table.ReadTableRowColumnData(0, 4).then(($cellData) => {
      expect($cellData).to.eq("Avocado Panini");
    });
    table.RemoveFilterNVerify("2381224", true, false);
  });

  it("7. Verify Table Filter for changing from AND -> OR -> along with changing Where clause condions", function() {
    table.OpenNFilterTable("id", "starts with", "2");
    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Michael Lawson");
    });
    table.ReadTableRowColumnData(1, 3, 200).then(($cellData) => {
      expect($cellData).to.eq("Lindsay Ferguson");
    });

    table.OpenNFilterTable("orderAmount", "contains", "19", "OR", 1);
    table.ReadTableRowColumnData(2, 3).then(($cellData) => {
      expect($cellData).to.eq("Tobias Funke");
    });

    //Changing filter conditions of both where rows - 1st row
    agHelper
      .GetNClick(table._filterInputValue, 0)
      .clear()
      .type("7")
      .wait(500);
    agHelper.ClickButton("APPLY");
    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Tobias Funke");
    });
    table.ReadTableRowColumnData(1, 3, 200).then(($cellData) => {
      expect($cellData).to.eq("Byron Fields");
    });
    table.ReadTableRowColumnData(2, 3, 200).then(($cellData) => {
      expect($cellData).to.eq("Ryan Holmes");
    });

    //Changing filter conditions of both where rows - 2nd row
    agHelper.GetNClick(table._filterConditionDropdown, 1);
    cy.get(table._dropdownText)
      .contains("does not contain")
      .click();
    agHelper.ClickButton("APPLY");
    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Michael Lawson");
    });
    table.ReadTableRowColumnData(1, 3, 200).then(($cellData) => {
      expect($cellData).to.eq("Lindsay Ferguson");
    });
    table.ReadTableRowColumnData(2, 3, 200).then(($cellData) => {
      expect($cellData).to.eq("Byron Fields");
    });
    table.ReadTableRowColumnData(3, 3, 200).then(($cellData) => {
      expect($cellData).to.eq("Ryan Holmes");
    });

    //Changing OR to AND
    agHelper.GetNClick(table._filterOperatorDropdown);
    cy.get(table._dropdownText)
      .contains("AND")
      .click();
    agHelper.ClickButton("APPLY");
    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Byron Fields");
    });
    table.ReadTableRowColumnData(1, 3, 200).then(($cellData) => {
      expect($cellData).to.eq("Ryan Holmes");
    });

    //Changing AND to OR
    agHelper.GetNClick(table._filterOperatorDropdown);
    cy.get(table._dropdownText)
      .contains("OR")
      .click();
    agHelper.GetNClick(table._filterConditionDropdown, 1);
    cy.get(table._dropdownText)
      .contains("starts with")
      .click();
    agHelper
      .GetNClick(table._filterInputValue, 1)
      .clear()
      .type("9")
      .wait(500);
    agHelper.ClickButton("APPLY");
    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Lindsay Ferguson");
    });
    table.ReadTableRowColumnData(1, 3, 200).then(($cellData) => {
      expect($cellData).to.eq("Byron Fields");
    });
    table.ReadTableRowColumnData(2, 3, 200).then(($cellData) => {
      expect($cellData).to.eq("Ryan Holmes");
    });
    table.RemoveFilterNVerify("2381224", true, false);
  });

  //Skipping until bug closed
  it.skip("8. Verify Table Filter for changing from AND -> OR [Remove a filter] -> AND + Bug 12642", function() {
    table.OpenNFilterTable("id", "contains", "7");
    table.ReadTableRowColumnData(1, 4).then(($cellData) => {
      expect($cellData).to.eq("Beef steak");
    });
    table.OpenNFilterTable("productName", "contains", "I", "AND", 1);
    table.ReadTableRowColumnData(1, 4).then(($cellData) => {
      expect($cellData).to.eq("Avocado Panini");
    });
    table.OpenNFilterTable("userName", "starts with", "r", "AND", 2);
    table.ReadTableRowColumnData(0, 4).then(($cellData) => {
      expect($cellData).to.eq("Avocado Panini");
    });

    agHelper.GetNClick(table._filterOperatorDropdown);
    cy.get(table._dropdownText)
      .contains("OR")
      .click();
    agHelper.ClickButton("APPLY");

    table.ReadTableRowColumnData(1, 4).then(($cellData) => {
      expect($cellData).to.eq("Tuna Salad");
    });

    table.RemoveFilterNVerify("2381224", false, true, 0); //Verifies bug 12642

    agHelper.GetNClick(table._filterOperatorDropdown);
    cy.get(table._dropdownText)
      .contains("AND")
      .click();
    agHelper.ClickButton("APPLY");

    table.ReadTableRowColumnData(0, 4).then(($cellData) => {
      expect($cellData).to.eq("Avocado Panini");
    });
    table.RemoveFilterNVerify("2381224", true, false);
  });

  it("9. Verify Full table data - download csv and download Excel", function() {
    table.DownloadFromTable("Download as CSV");
    //This plugin works only from cypress ^9.2
    //cy.verifyDownload("Table1.csv")
    table.ValidateDownloadNVerify("Table1.csv", "Michael Lawson");

    table.DownloadFromTable("Download as Excel");
    table.ValidateDownloadNVerify("Table1.xlsx", "Michael Lawson");
  });

  it("10. Verify Searched data - download csv and download Excel", function() {
    table.SearchTable("7434532");
    table.ReadTableRowColumnData(0, 3).then((afterSearch) => {
      expect(afterSearch).to.eq("Byron Fields");
    });

    table.DownloadFromTable("Download as CSV");
    //This plugin works only from cypress ^9.2
    //cy.verifyDownload("Table1.csv")
    table.ValidateDownloadNVerify("Table1.csv", "byron.fields@reqres.in");

    table.DownloadFromTable("Download as Excel");
    table.ValidateDownloadNVerify("Table1.xlsx", "Ryan Holmes");

    table.RemoveSearchTextNVerify("2381224");

    table.DownloadFromTable("Download as CSV");
    table.ValidateDownloadNVerify("Table1.csv", "2736212");

    table.DownloadFromTable("Download as Excel");
    table.ValidateDownloadNVerify("Table1.xlsx", "Beef steak");
  });

  it("11. Verify Filtered data - download csv and download Excel", function() {
    table.OpenNFilterTable("id", "starts with", "6");
    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Tobias Funke");
    });
    table.CloseFilter();

    table.DownloadFromTable("Download as CSV");
    //This plugin works only from cypress ^9.2
    //cy.verifyDownload("Table1.csv")
    table.ValidateDownloadNVerify("Table1.csv", "Beef steak");

    table.DownloadFromTable("Download as Excel");
    table.ValidateDownloadNVerify("Table1.xlsx", "tobias.funke@reqres.in");

    agHelper.GetNClick(table._filterBtn);
    table.RemoveFilterNVerify("2381224", true, false);

    table.DownloadFromTable("Download as CSV");
    table.ValidateDownloadNVerify("Table1.csv", "Tuna Salad");

    table.DownloadFromTable("Download as Excel");
    table.ValidateDownloadNVerify("Table1.xlsx", "Avocado Panini");
  });

  it("12. Import TableFilter application & verify all filters for same FirstName (one word column) + Bug 13334", () => {
    deployMode.NavigateBacktoEditor();
    table.WaitUntilTableLoad();
    homePage.NavigateToHome();
    homePage.ImportApp("Table/TableFilterImportApp.json");
    homePage.AssertImportToast();
    deployMode.DeployApp();
    table.WaitUntilTableLoad();

    //Contains
    table.OpenNFilterTable("FirstName", "contains", "Della");
    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Alvarado");
    });

    filterOnlyCondition("does not contain", "49");
    filterOnlyCondition("starts with", "1");

    //Ends with - Open Bug 13334
    //filterOnlyCondition('ends with', '1')

    filterOnlyCondition("is exactly", "1");
    filterOnlyCondition("empty", "0");
    filterOnlyCondition("not empty", "50");
    filterOnlyCondition("starts with", "3", "ge");
    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
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
    table.RemoveFilterNVerify("1", true, false);
  });

  it("13. Verify all filters for same FullName (two word column) + Bug 13334", () => {
    //Contains
    table.OpenNFilterTable("FullName", "contains", "torres");
    table.ReadTableRowColumnData(0, 2).then(($cellData) => {
      expect($cellData).to.eq("Virgie");
    });

    filterOnlyCondition("does not contain", "49");
    filterOnlyCondition("starts with", "0");
    filterOnlyCondition("ends with", "1");
    filterOnlyCondition("is exactly", "0");
    filterOnlyCondition("empty", "0");
    filterOnlyCondition("not empty", "50");
    filterOnlyCondition("contains", "1", "wolf");
    table.ReadTableRowColumnData(0, 2).then(($cellData) => {
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
      .then(($count) => expect($count).contain("10"));
    table.CloseFilter();
    agHelper
      .GetText(table._filtersCount)
      .then(($count) => expect($count).contain("3"));

    table.OpenFilter();
    table.RemoveFilterNVerify("1", true, false);
  });

  it("14. Verify Table Filter for correct value in filter value input after removing second filter - Bug 12638", function() {
    table.OpenNFilterTable("seq", "greater than", "5");

    table.OpenNFilterTable("FirstName", "contains", "r", "AND", 1);

    table.OpenNFilterTable("LastName", "contains", "son", "AND", 2);
    table.agHelper.GetNClick(".t--table-filter-remove-btn", 1);
    cy.wait(500);
    cy.get(
      ".t--table-filter:nth-child(2) .t--table-filter-value-input input[type=text]",
    ).should("have.value", "son");
    table.agHelper.GetNClick(".t--clear-all-filter-btn");
    table.agHelper.GetNClick(".t--close-filter-btn");
  });

  it("15. Verify Table Filter operator for correct value after removing where clause condition - Bug 12642", function() {
    table.OpenNFilterTable("seq", "greater than", "5");

    table.OpenNFilterTable("FirstName", "contains", "r", "AND", 1);

    table.OpenNFilterTable("LastName", "contains", "son", "AND", 2);
    table.agHelper.GetNClick(".t--table-filter-operators-dropdown");
    cy.get(".t--dropdown-option")
      .contains("OR")
      .click();
    table.agHelper.GetNClick(".t--table-filter-remove-btn", 0);
    cy.get(".t--table-filter-operators-dropdown div div span").should(
      "contain",
      "OR",
    );
    table.agHelper.GetNClick(".t--clear-all-filter-btn");
  });

  function filterOnlyCondition(
    condition: string,
    expectedCount: string,
    input: string | "" = "",
  ) {
    agHelper.GetNClick(table._filterConditionDropdown);
    cy.get(table._dropdownText)
      .contains(condition)
      .click();
    if (input)
      agHelper
        .GetNClick(table._filterInputValue, 0)
        .type(input)
        .wait(500);
    agHelper.ClickButton("APPLY");
    agHelper
      .GetText(table._showPageItemsCount)
      .then(($count) => expect($count).contain(expectedCount));
  }
});
