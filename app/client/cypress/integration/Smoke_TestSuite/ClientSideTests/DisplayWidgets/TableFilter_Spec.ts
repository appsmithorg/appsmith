import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let dataSet: any;
const agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  jsEditor = ObjectsRegistry.JSEditor,
  table = ObjectsRegistry.Table;

describe("Verify various Table_Filter combinations", function () {
  before(() => {
    cy.fixture("example").then(function (data: any) {
      dataSet = data;
    });
  });

  it("1. Adding Data to Table Widget", function () {
    ee.DragDropWidgetNVerify("tablewidget", 250, 250);
    jsEditor.EnterJSContext("Table Data", JSON.stringify(dataSet.TableInput));
    agHelper.ValidateNetworkStatus("@updateLayout", 200);
    cy.get('body').type("{esc}");
    agHelper.DeployApp()
  });

  it("2. Table Widget Search Functionality", function () {
    table.ReadTableRowColumnData(1, 3).then((cellData) => {
      expect(cellData).to.eq("Lindsay Ferguson");
      table.SearchTable(cellData)
      table.ReadTableRowColumnData(0, 3).then((afterSearch) => {
        expect(afterSearch).to.eq("Lindsay Ferguson");
      });
    });
    table.RemoveSearchTextNVerify("2381224")

    table.SearchTable("7434532")
    table.ReadTableRowColumnData(0, 3).then((afterSearch) => {
      expect(afterSearch).to.eq("Byron Fields");
    });
    table.RemoveSearchTextNVerify("2381224")
  });

  it("3. Verify Table Filter for 'contain'", function () {
    table.FilterTable("userName", "contains", "Lindsay")
    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Lindsay Ferguson");
    });
    table.RemoveFilterNVerify("2381224")
  });

  it("4. Verify Table Filter for 'does not contain'", function () {
    table.ReadTableRowColumnData(1, 4).then(($cellData) => {
      expect($cellData).to.eq("Tuna Salad");
    });
    table.FilterTable("productName", "does not contain", "Tuna")
    table.ReadTableRowColumnData(1, 4).then(($cellData) => {
      expect($cellData).to.eq("Beef steak");
    });
    table.RemoveFilterNVerify("2381224")
  });

  it("5. Verify Table Filter for 'starts with'", function () {
    table.ReadTableRowColumnData(4, 4).then(($cellData) => {
      expect($cellData).to.eq("Avocado Panini");
    });
    table.FilterTable("productName", 'starts with', "Avo")
    table.ReadTableRowColumnData(0, 4).then(($cellData) => {
      expect($cellData).to.eq("Avocado Panini");
    });
    table.RemoveFilterNVerify("2381224")
  });

  it("6. Verify Table Filter for 'ends with' - case sensitive", function () {
    table.ReadTableRowColumnData(1, 4).then(($cellData) => {
      expect($cellData).to.eq("Tuna Salad");
    });
    table.FilterTable("productName", "ends with", "wich")
    table.ReadTableRowColumnData(1, 4).then(($cellData) => {
      expect($cellData).to.eq("Chicken Sandwich");
    });
    table.RemoveFilterNVerify("2381224")
  });

  it("7. Verify Table Filter for 'ends with' - case insenstive", function () {
    table.ReadTableRowColumnData(1, 4).then(($cellData) => {
      expect($cellData).to.eq("Tuna Salad");
    });
    table.FilterTable("productName", "ends with", "WICH")
    table.ReadTableRowColumnData(1, 4).then(($cellData) => {
      expect($cellData).to.eq("Chicken Sandwich");
    });
    table.RemoveFilterNVerify("2381224")
  });

  it("8. Verify Table Filter for 'ends with' - on wrong column", function () {
    table.ReadTableRowColumnData(1, 4).then(($cellData) => {
      expect($cellData).to.eq("Tuna Salad");
    });
    table.FilterTable("userName", "ends with", "WICH")
    table.WaitForTableEmpty()
    table.RemoveFilterNVerify("2381224")
  });

  it("9. Verify Table Filter for 'is exactly' - case sensitive", function () {
    table.ReadTableRowColumnData(2, 4).then(($cellData) => {
      expect($cellData).to.eq("Beef steak");
    });
    table.FilterTable("productName", "is exactly", "Beef steak")
    table.ReadTableRowColumnData(0, 4).then(($cellData) => {
      expect($cellData).to.eq("Beef steak");
    });
    table.RemoveFilterNVerify("2381224", true)
  });

  it("10. Verify Table Filter for 'is exactly' - case insensitive", function () {
    table.ReadTableRowColumnData(2, 4).then(($cellData) => {
      expect($cellData).to.eq("Beef steak");
    });
    table.FilterTable("productName", "is exactly", "Beef STEAK")
    table.WaitForTableEmpty()
    table.RemoveFilterNVerify("2381224", true)
  });

  it("11. Verify Table Filter for 'empty'", function () {
    table.FilterTable("email", "empty")
    table.WaitForTableEmpty()
    table.RemoveFilterNVerify("2381224")
  });

  it("12. Verify Table Filter for 'not empty'", function () {
    table.ReadTableRowColumnData(4, 5).then(($cellData) => {
      expect($cellData).to.eq("7.99");
    });
    table.FilterTable("orderAmount", "not empty")
    table.ReadTableRowColumnData(4, 5).then(($cellData) => {
      expect($cellData).to.eq("7.99");
    });
    table.RemoveFilterNVerify("2381224")
  });

  it("13. Verify Table Filter - Where Edit - Single condition with input value", function () {

    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Michael Lawson");
    });

    table.FilterTable("orderAmount", "is exactly", "4.99")
    table.ReadTableRowColumnData(1, 3).then(($cellData) => {
      expect($cellData).to.eq("Byron Fields");
    });

    //Change condition - 1st time
    agHelper.GetNClick(table._filterConditionDropdown)
    cy.get(table._dropdownText).contains("empty").click()
    agHelper.ClickButton("APPLY")
    table.WaitForTableEmpty()

    //Change condition - 2nd time
    agHelper.GetNClick(table._filterConditionDropdown)
    cy.get(table._dropdownText).contains("contains").click()
    agHelper.GetNClick(table._filterInputValue, 0).type('19').wait(500)
    agHelper.ClickButton("APPLY")
    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Tobias Funke");
    });
    table.RemoveFilterNVerify("2381224", true, false)
  });

  it("14. Verify Table Filter - Where Edit - Single Column, Condition & input value", function () {

    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Michael Lawson");
    });

    table.FilterTable("productName", "contains", "e")
    table.ReadTableRowColumnData(0, 4).then(($cellData) => {
      expect($cellData).to.eq("Chicken Sandwich");
    });
    table.ReadTableRowColumnData(1, 4, 200).then(($cellData) => {
      expect($cellData).to.eq("Beef steak");
    });
    table.ReadTableRowColumnData(2, 4, 200).then(($cellData) => {
      expect($cellData).to.eq("Chicken Sandwich");
    });

    //Change condition - 1st time
    agHelper.GetNClick(table._filterConditionDropdown)
    cy.get(table._dropdownText).contains("does not contain").click()
    agHelper.ClickButton("APPLY")
    table.ReadTableRowColumnData(0, 4).then(($cellData) => {
      expect($cellData).to.eq("Tuna Salad");
    });
    table.ReadTableRowColumnData(1, 4).then(($cellData) => {
      expect($cellData).to.eq("Avocado Panini");
    });

    //Change condition - column value
    agHelper.GetNClick(table._filterColumnsDropdown)
    cy.get(table._dropdownText).contains("userName").click()
    agHelper.GetNClick(table._filterConditionDropdown)
    cy.get(table._dropdownText).contains("does not contain").click()
    agHelper.ClickButton("APPLY")
    table.WaitForTableEmpty()

    //Change input value
    agHelper.GetNClick(table._filterInputValue, 0).clear().type('i').wait(500)
    agHelper.ClickButton("APPLY")
    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Ryan Holmes");
    });

    table.RemoveFilterNVerify("2381224", true, false)
  });

  it("15. Verify Table Filter for OR operator - different row match", function () {

    table.ReadTableRowColumnData(2, 3).then(($cellData) => {
      expect($cellData).to.eq("Tobias Funke");
    });

    table.FilterTable("email", "contains", "on")
    table.ReadTableRowColumnData(2, 3).then(($cellData) => {
      expect($cellData).to.eq("Byron Fields");
    });
    table.FilterTable("productName", "ends with", "steak", 'OR', 1)
    table.ReadTableRowColumnData(2, 3).then(($cellData) => {
      expect($cellData).to.eq("Tobias Funke");
    });
    table.RemoveFilterNVerify("2381224", true, false)

  });

  it("16. Verify Table Filter for OR operator - same row match", function () {

    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Michael Lawson");
    });
    table.FilterTable("email", "contains", "hol")
    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Ryan Holmes");
    });
    table.FilterTable("userName", "starts with", "ry", 'OR', 1)
    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Ryan Holmes");
    });
    table.RemoveFilterNVerify("2381224", true, false)
  });

  it("17. Verify Table Filter for OR operator - two 'ORs'", function () {

    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Michael Lawson");
    });
    table.FilterTable("email", "starts with", "by")
    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Byron Fields");
    });
    table.FilterTable("productName", "ends with", "ni", 'OR', 1)
    table.ReadTableRowColumnData(1, 3).then(($cellData) => {
      expect($cellData).to.eq("Ryan Holmes");
    });
    table.FilterTable("userName", "contains", "law", 'OR', 2)
    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Michael Lawson");
    });
    table.RemoveFilterNVerify("2381224", true, false)
  });

  it("18. Verify Table Filter for AND operator - different row match", function () {
    table.ReadTableRowColumnData(3, 3).then(($cellData) => {
      expect($cellData).to.eq("Byron Fields");
    });
    table.FilterTable("userName", "starts with", "b")
    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Byron Fields");
    });
    table.FilterTable("productName", "does not contain", "WICH", 'AND', 1)
    table.WaitForTableEmpty()
    table.RemoveFilterNVerify("2381224", true, false)

  });

  it("19. Verify Table Filter for AND operator - same row match", function () {

    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Michael Lawson");
    });
    table.FilterTable("userName", "ends with", "s")
    table.ReadTableRowColumnData(1, 3).then(($cellData) => {
      expect($cellData).to.eq("Ryan Holmes");
    });
    table.FilterTable("orderAmount", "is exactly", "4.99", 'AND', 1)
    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Byron Fields");
    });
    table.RemoveFilterNVerify("2381224", true, false)
  });

  it("20. Verify Table Filter for AND operator - same row match - edit input text value", function () {

    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Michael Lawson");
    });
    table.FilterTable("userName", "ends with", "s")
    table.ReadTableRowColumnData(1, 3).then(($cellData) => {
      expect($cellData).to.eq("Ryan Holmes");
    });
    table.FilterTable("orderAmount", "is exactly", "4.99", 'AND', 1)
    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Byron Fields");
    });
    agHelper.GetNClick(table._filterInputValue, 1).clear().type('7.99').wait(500)
    agHelper.ClickButton("APPLY")
    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Ryan Holmes");
    });
    table.RemoveFilterNVerify("2381224", true, false)
  });

  it("21. Verify Table Filter for AND operator - same row match - Where Edit - input value", function () {

    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Michael Lawson");
    });
    table.FilterTable("userName", "ends with", "s")
    table.ReadTableRowColumnData(1, 3).then(($cellData) => {
      expect($cellData).to.eq("Ryan Holmes");
    });
    table.FilterTable("orderAmount", "is exactly", "4.99", 'AND', 1)
    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Byron Fields");
    });
    agHelper.GetNClick(table._filterInputValue, 1).clear().type('7.99').wait(500)
    agHelper.ClickButton("APPLY")
    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Ryan Holmes");
    });
    table.RemoveFilterNVerify("2381224", true, false)
  });

  it("22. Verify Table Filter for AND operator - two 'ANDs' - clearAll", function () {

    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Michael Lawson");
    });
    table.FilterTable("id", "contains", "7434532")
    table.ReadTableRowColumnData(1, 3).then(($cellData) => {
      expect($cellData).to.eq("Ryan Holmes");
    });
    table.FilterTable("productName", "contains", "i", 'AND', 1)
    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Byron Fields");
    });
    table.FilterTable("orderAmount", "starts with", "7", 'AND', 2)
    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Ryan Holmes");
    });
    table.RemoveFilterNVerify("2381224", true, false)
  });

  it("23. Verify Table Filter for AND operator - two 'ANDs' - removeOne filter condition + Bug 12638", function () {
    table.FilterTable("id", "contains", "2")
    table.ReadTableRowColumnData(1, 3).then(($cellData) => {
      expect($cellData).to.eq("Lindsay Ferguson");
    });
    table.FilterTable("productName", "ends with", "WICH", 'AND', 1)
    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Michael Lawson");
    });
    table.FilterTable("userName", "does not contain", "son", 'AND', 2)
    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Byron Fields");
    });
    table.RemoveFilterNVerify("7434532", false, true, 1)
    //Bug 12638
    table.ReadTableRowColumnData(1, 3).then(($cellData) => {
      expect($cellData).to.eq("Ryan Holmes");
    });
    table.RemoveFilterNVerify("2381224", true, false)

  });

  it("24. Verify Table Filter for AND operator - two 'ANDs' - removeOne filter twice + Bug 12638", function () {
    table.FilterTable("id", "starts with", "2")
    table.ReadTableRowColumnData(1, 3).then(($cellData) => {
      expect($cellData).to.eq("Lindsay Ferguson");
    });
    table.FilterTable("productName", "ends with", "WICH", 'AND', 1)
    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Michael Lawson");
    });
    table.FilterTable("userName", "contains", "on", 'AND', 2)
    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Michael Lawson");
    });
    table.RemoveFilterNVerify("2381224", false, true, 1)
    table.RemoveFilterNVerify("2381224", false, true, 0)

    //Bug 12638 - verification to add here - once closed 

    table.ReadTableRowColumnData(1, 3).then(($cellData) => {
      expect($cellData).to.eq("Lindsay Ferguson");
    });
    table.RemoveFilterNVerify("2381224", true, false)
  });

  it("25. Verify Table Filter for changing from AND -> OR -> AND", function () {
    table.FilterTable("id", "contains", "7")
    table.ReadTableRowColumnData(1, 4).then(($cellData) => {
      expect($cellData).to.eq("Beef steak");
    });
    table.FilterTable("productName", "contains", "I", 'AND', 1)
    table.ReadTableRowColumnData(1, 4).then(($cellData) => {
      expect($cellData).to.eq("Avocado Panini");
    });
    table.FilterTable("userName", "starts with", "r", 'AND', 2)
    table.ReadTableRowColumnData(0, 4).then(($cellData) => {
      expect($cellData).to.eq("Avocado Panini");
    });

    agHelper.GetNClick(table._filterOperatorDropdown)
    cy.get(table._dropdownText).contains("OR").click()
    agHelper.ClickButton("APPLY")

    table.ReadTableRowColumnData(1, 4).then(($cellData) => {
      expect($cellData).to.eq("Tuna Salad");
    });

    agHelper.GetNClick(table._filterOperatorDropdown)
    cy.get(table._dropdownText).contains("AND").click()
    agHelper.ClickButton("APPLY")

    table.ReadTableRowColumnData(0, 4).then(($cellData) => {
      expect($cellData).to.eq("Avocado Panini");
    });
    table.RemoveFilterNVerify("2381224", true, false)

  });

  it("26. Verify Table Filter for changing from AND -> OR -> along with changing Where clause condions", function () {

    table.FilterTable("id", "starts with", "2")
    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Michael Lawson");
    });
    table.ReadTableRowColumnData(1, 3, 200).then(($cellData) => {
      expect($cellData).to.eq("Lindsay Ferguson");
    });

    table.FilterTable("orderAmount", "contains", "19", 'OR', 1)
    table.ReadTableRowColumnData(2, 3).then(($cellData) => {
      expect($cellData).to.eq("Tobias Funke");
    });

    //Changing filter conditions of both where rows - 1st row
    agHelper.GetNClick(table._filterInputValue, 0).clear().type('7').wait(500)
    agHelper.ClickButton("APPLY")
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
    agHelper.GetNClick(table._filterConditionDropdown, 1)
    cy.get(table._dropdownText).contains("does not contain").click()
    agHelper.ClickButton("APPLY")
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
    agHelper.GetNClick(table._filterOperatorDropdown)
    cy.get(table._dropdownText).contains("AND").click()
    agHelper.ClickButton("APPLY")
    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Byron Fields");
    });
    table.ReadTableRowColumnData(1, 3, 200).then(($cellData) => {
      expect($cellData).to.eq("Ryan Holmes");
    });

    //Changing AND to OR
    agHelper.GetNClick(table._filterOperatorDropdown)
    cy.get(table._dropdownText).contains("OR").click()
    agHelper.GetNClick(table._filterConditionDropdown, 1)
    cy.get(table._dropdownText).contains("starts with").click()
    agHelper.GetNClick(table._filterInputValue, 1).clear().type('9').wait(500)
    agHelper.ClickButton("APPLY")
    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Lindsay Ferguson");
    });
    table.ReadTableRowColumnData(1, 3, 200).then(($cellData) => {
      expect($cellData).to.eq("Byron Fields");
    });
    table.ReadTableRowColumnData(2, 3, 200).then(($cellData) => {
      expect($cellData).to.eq("Ryan Holmes");
    });
    table.RemoveFilterNVerify("2381224", true, false)

  });

  //Skipping until bug closed
  it.skip("27. Verify Table Filter for changing from AND -> OR [Remove a filter] -> AND + Bug 12642", function () {

    table.FilterTable("id", "contains", "7")
    table.ReadTableRowColumnData(1, 4).then(($cellData) => {
      expect($cellData).to.eq("Beef steak");
    });
    table.FilterTable("productName", "contains", "I", 'AND', 1)
    table.ReadTableRowColumnData(1, 4).then(($cellData) => {
      expect($cellData).to.eq("Avocado Panini");
    });
    table.FilterTable("userName", "starts with", "r", 'AND', 2)
    table.ReadTableRowColumnData(0, 4).then(($cellData) => {
      expect($cellData).to.eq("Avocado Panini");
    });

    agHelper.GetNClick(table._filterOperatorDropdown)
    cy.get(table._dropdownText).contains("OR").click()
    agHelper.ClickButton("APPLY")

    table.ReadTableRowColumnData(1, 4).then(($cellData) => {
      expect($cellData).to.eq("Tuna Salad");
    });

    table.RemoveFilterNVerify("2381224", false, true, 0) //Verifies bug 12642

    agHelper.GetNClick(table._filterOperatorDropdown)
    cy.get(table._dropdownText).contains("AND").click()
    agHelper.ClickButton("APPLY")

    table.ReadTableRowColumnData(0, 4).then(($cellData) => {
      expect($cellData).to.eq("Avocado Panini");
    });
    table.RemoveFilterNVerify("2381224", true, false)

  });

  it("28. Verify Full table data - download csv and download Excel", function () {

    table.DownloadFromTable("Download as CSV")
    //This plugin works only from cypress ^9.2
    //cy.verifyDownload("Table1.csv")
    table.ValidateDownloadNVerify("Table1.csv", "Michael Lawson")

    table.DownloadFromTable("Download as Excel")
    table.ValidateDownloadNVerify("Table1.xlsx", "Michael Lawson");    
  });

  it("28. Verify Searched data - download csv and download Excel", function () {
    table.SearchTable("7434532")
    table.ReadTableRowColumnData(0, 3).then((afterSearch) => {
      expect(afterSearch).to.eq("Byron Fields");
    });

    table.DownloadFromTable("Download as CSV")
    //This plugin works only from cypress ^9.2
    //cy.verifyDownload("Table1.csv")
    table.ValidateDownloadNVerify("Table1.csv", "byron.fields@reqres.in")

    table.DownloadFromTable("Download as Excel")
    table.ValidateDownloadNVerify("Table1.xlsx", "Ryan Holmes");    

    table.RemoveSearchTextNVerify("2381224")

    table.DownloadFromTable("Download as CSV")
    table.ValidateDownloadNVerify("Table1.csv", "2736212")

    table.DownloadFromTable("Download as Excel")
    table.ValidateDownloadNVerify("Table1.xlsx", "Beef steak"); 
  });

  it("29. Verify Filtered data - download csv and download Excel", function () {
    table.FilterTable("id", "starts with", "6")
    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Tobias Funke");
    });
    table.CloseFilter()

    table.DownloadFromTable("Download as CSV")
    //This plugin works only from cypress ^9.2
    //cy.verifyDownload("Table1.csv")
    table.ValidateDownloadNVerify("Table1.csv", "Beef steak")

    table.DownloadFromTable("Download as Excel")
    table.ValidateDownloadNVerify("Table1.xlsx", "tobias.funke@reqres.in");    

    agHelper.GetNClick(table._filterBtn)
    table.RemoveFilterNVerify("2381224", true, false)

    table.DownloadFromTable("Download as CSV")
    table.ValidateDownloadNVerify("Table1.csv", "Tuna Salad")

    table.DownloadFromTable("Download as Excel")
    table.ValidateDownloadNVerify("Table1.xlsx", "Avocado Panini"); 
  });

});

