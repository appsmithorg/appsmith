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
    propPane.UpdatePropertyFieldValue("Table Data", JSON.stringify(dataSet.TableInput))
    agHelper.ValidateNetworkStatus("@updateLayout", 200);
    cy.get("body").type("{esc}");
    deployMode.DeployApp();
  });

  it("2. Table Widget Search Functionality", function() {
    table.ReadTableRowColumnData(1, 3).then((cellData) => {
      expect(cellData).to.eq("Lindsay Ferguson");
      table.SearchTable(cellData);
      table.ReadTableRowColumnData(0, 3).then((afterSearch) => {
        expect(afterSearch).to.eq("Lindsay Ferguson");
      });
    });
    table.RemoveSearchTextNVerify("2381224");

    table.SearchTable("7434532");
    table.ReadTableRowColumnData(0, 3).then((afterSearch) => {
      expect(afterSearch).to.eq("Byron Fields");
    });
    table.RemoveSearchTextNVerify("2381224");
  });

  it("3. Verify Table Filter for 'contain'", function() {
    table.OpenNFilterTable("userName", "contains", "Lindsay");
    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Lindsay Ferguson");
    });
    table.RemoveFilterNVerify("2381224");
  });

  it("4. Verify Table Filter for 'does not contain'", function() {
    table.ReadTableRowColumnData(1, 4).then(($cellData) => {
      expect($cellData).to.eq("Tuna Salad");
    });
    table.OpenNFilterTable("productName", "does not contain", "Tuna");
    table.ReadTableRowColumnData(1, 4).then(($cellData) => {
      expect($cellData).to.eq("Beef steak");
    });
    table.RemoveFilterNVerify("2381224");
  });

  it("5. Verify Table Filter for 'starts with'", function() {
    table.ReadTableRowColumnData(4, 4).then(($cellData) => {
      expect($cellData).to.eq("Avocado Panini");
    });
    table.OpenNFilterTable("productName", "starts with", "Avo");
    table.ReadTableRowColumnData(0, 4).then(($cellData) => {
      expect($cellData).to.eq("Avocado Panini");
    });
    table.RemoveFilterNVerify("2381224");
  });

  it("6. Verify Table Filter for 'ends with' - case sensitive", function() {
    table.ReadTableRowColumnData(1, 4).then(($cellData) => {
      expect($cellData).to.eq("Tuna Salad");
    });
    table.OpenNFilterTable("productName", "ends with", "wich");
    table.ReadTableRowColumnData(1, 4).then(($cellData) => {
      expect($cellData).to.eq("Chicken Sandwich");
    });
    table.RemoveFilterNVerify("2381224");
  });

  it("7. Verify Table Filter for 'ends with' - case insenstive", function() {
    table.ReadTableRowColumnData(1, 4).then(($cellData) => {
      expect($cellData).to.eq("Tuna Salad");
    });
    table.OpenNFilterTable("productName", "ends with", "WICH");
    table.ReadTableRowColumnData(1, 4).then(($cellData) => {
      expect($cellData).to.eq("Chicken Sandwich");
    });
    table.RemoveFilterNVerify("2381224");
  });

  it("8. Verify Table Filter for 'ends with' - on wrong column", function() {
    table.ReadTableRowColumnData(1, 4).then(($cellData) => {
      expect($cellData).to.eq("Tuna Salad");
    });
    table.OpenNFilterTable("userName", "ends with", "WICH");
    table.WaitForTableEmpty();
    table.RemoveFilterNVerify("2381224");
  });

  it("9. Verify Table Filter for 'is exactly' - case sensitive", function() {
    table.ReadTableRowColumnData(2, 4).then(($cellData) => {
      expect($cellData).to.eq("Beef steak");
    });
    table.OpenNFilterTable("productName", "is exactly", "Beef steak");
    table.ReadTableRowColumnData(0, 4).then(($cellData) => {
      expect($cellData).to.eq("Beef steak");
    });
    table.RemoveFilterNVerify("2381224", true);
  });

  it("10. Verify Table Filter for 'is exactly' - case insensitive", function() {
    table.ReadTableRowColumnData(2, 4).then(($cellData) => {
      expect($cellData).to.eq("Beef steak");
    });
    table.OpenNFilterTable("productName", "is exactly", "Beef STEAK");
    table.WaitForTableEmpty();
    table.RemoveFilterNVerify("2381224", true);
  });

  it("11. Verify Table Filter for 'empty'", function() {
    table.OpenNFilterTable("email", "empty");
    table.WaitForTableEmpty();
    table.RemoveFilterNVerify("2381224");
  });

  it("12. Verify Table Filter for 'not empty'", function() {
    table.ReadTableRowColumnData(4, 5).then(($cellData) => {
      expect($cellData).to.eq("7.99");
    });
    table.OpenNFilterTable("orderAmount", "not empty");
    table.ReadTableRowColumnData(4, 5).then(($cellData) => {
      expect($cellData).to.eq("7.99");
    });
    table.RemoveFilterNVerify("2381224");
  });

  it("13. Verify Table Filter - Where Edit - Change condition along with input value", function() {
    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Michael Lawson");
    });

    table.OpenNFilterTable("orderAmount", "is exactly", "4.99");
    table.ReadTableRowColumnData(1, 3).then(($cellData) => {
      expect($cellData).to.eq("Byron Fields");
    });

    //Change condition - 1st time
    agHelper.GetNClick(table._filterConditionDropdown);
    cy.get(table._dropdownText)
      .contains("empty")
      .click();
    agHelper.ClickButton("APPLY");
    table.WaitForTableEmpty();

    //Change condition - 2nd time
    agHelper.GetNClick(table._filterConditionDropdown);
    cy.get(table._dropdownText)
      .contains("contains")
      .click();
    agHelper
      .GetNClick(table._filterInputValue, 0)
      .type("19")
      .wait(500);
    agHelper.ClickButton("APPLY");
    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Tobias Funke");
    });
    table.RemoveFilterNVerify("2381224", true, false);
  });

  it("14. Verify Table Filter - Where Edit - Single Column, Condition & input value", function() {
    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Michael Lawson");
    });

    table.OpenNFilterTable("productName", "contains", "e");
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
    agHelper.GetNClick(table._filterConditionDropdown);
    cy.get(table._dropdownText)
      .contains("does not contain")
      .click();
    agHelper.ClickButton("APPLY");
    table.ReadTableRowColumnData(0, 4).then(($cellData) => {
      expect($cellData).to.eq("Tuna Salad");
    });
    table.ReadTableRowColumnData(1, 4).then(($cellData) => {
      expect($cellData).to.eq("Avocado Panini");
    });

    //Change condition - column value
    agHelper.GetNClick(table._filterColumnsDropdown);
    cy.get(table._dropdownText)
      .contains("userName")
      .click();
    agHelper.GetNClick(table._filterConditionDropdown);
    cy.get(table._dropdownText)
      .contains("does not contain")
      .click();
    agHelper.ClickButton("APPLY");
    table.WaitForTableEmpty();

    //Change input value
    agHelper
      .GetNClick(table._filterInputValue, 0)
      .clear()
      .type("i")
      .wait(500);
    agHelper.ClickButton("APPLY");
    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Ryan Holmes");
    });

    table.RemoveFilterNVerify("2381224", true, false);
  });

  it("15. Verify Table Filter for OR operator - different row match", function() {
    table.ReadTableRowColumnData(2, 3).then(($cellData) => {
      expect($cellData).to.eq("Tobias Funke");
    });

    table.OpenNFilterTable("email", "contains", "on");
    table.ReadTableRowColumnData(2, 3).then(($cellData) => {
      expect($cellData).to.eq("Byron Fields");
    });
    table.OpenNFilterTable("productName", "ends with", "steak", "OR", 1);
    table.ReadTableRowColumnData(2, 3).then(($cellData) => {
      expect($cellData).to.eq("Tobias Funke");
    });
    table.RemoveFilterNVerify("2381224", true, false);
  });

  it("16. Verify Table Filter for OR operator - same row match", function() {
    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Michael Lawson");
    });
    table.OpenNFilterTable("email", "contains", "hol");
    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Ryan Holmes");
    });
    table.OpenNFilterTable("userName", "starts with", "ry", "OR", 1);
    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Ryan Holmes");
    });
    table.RemoveFilterNVerify("2381224", true, false);
  });

  it("17. Verify Table Filter for OR operator - two 'ORs'", function() {
    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Michael Lawson");
    });
    table.OpenNFilterTable("email", "starts with", "by");
    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Byron Fields");
    });
    table.OpenNFilterTable("productName", "ends with", "ni", "OR", 1);
    table.ReadTableRowColumnData(1, 3).then(($cellData) => {
      expect($cellData).to.eq("Ryan Holmes");
    });
    table.OpenNFilterTable("userName", "contains", "law", "OR", 2);
    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Michael Lawson");
    });
    table.RemoveFilterNVerify("2381224", true, false);
  });

  it("18. Verify Table Filter for AND operator - different row match", function() {
    table.ReadTableRowColumnData(3, 3).then(($cellData) => {
      expect($cellData).to.eq("Byron Fields");
    });
    table.OpenNFilterTable("userName", "starts with", "b");
    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Byron Fields");
    });
    table.OpenNFilterTable("productName", "does not contain", "WICH", "AND", 1);
    table.WaitForTableEmpty();
    table.RemoveFilterNVerify("2381224", true, false);
  });

  it("19. Verify Table Filter for AND operator - same row match", function() {
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
    table.RemoveFilterNVerify("2381224", true, false);
  });

  it("20. Verify Table Filter for AND operator - same row match - edit input text value", function() {
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
});
