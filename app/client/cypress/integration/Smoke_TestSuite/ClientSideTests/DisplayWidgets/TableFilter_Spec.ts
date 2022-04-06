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
    table.ReadTableRowColumnData(0, 3).then((afterSearch) => {
      expect(afterSearch).to.eq("Lindsay Ferguson");
    });
    table.RemoveFilterNVerify("2381224")
  });

  it("4. Verify Table Filter for 'does not contain'", function () {
    table.ReadTableRowColumnData(1, 4).then((afterSearch) => {
      expect(afterSearch).to.eq("Tuna Salad");
    });
    table.FilterTable("productName", "does not contain", "Tuna")
    table.ReadTableRowColumnData(1, 4).then((afterSearch) => {
      expect(afterSearch).to.eq("Beef steak");
    });
    table.RemoveFilterNVerify("2381224")
  });

  it("5. Verify Table Filter for 'starts with'", function () {
    table.ReadTableRowColumnData(4, 4).then((afterSearch) => {
      expect(afterSearch).to.eq("Avocado Panini");
    });
    table.FilterTable("productName", 'starts with', "Avo")
    table.ReadTableRowColumnData(0, 4).then((afterSearch) => {
      expect(afterSearch).to.eq("Avocado Panini");
    });
    table.RemoveFilterNVerify("2381224")
  });

  it("6. Verify Table Filter for 'ends with' - case sensitive", function () {
    table.ReadTableRowColumnData(1, 4).then((afterSearch) => {
      expect(afterSearch).to.eq("Tuna Salad");
    });
    table.FilterTable("productName", "ends with", "wich")
    table.ReadTableRowColumnData(1, 4).then((afterSearch) => {
      expect(afterSearch).to.eq("Chicken Sandwich");
    });
    table.RemoveFilterNVerify("2381224")
  });

  it("7. Verify Table Filter for 'ends with' - case insenstive", function () {
    table.ReadTableRowColumnData(1, 4).then((afterSearch) => {
      expect(afterSearch).to.eq("Tuna Salad");
    });
    table.FilterTable("productName", "ends with", "WICH")
    table.ReadTableRowColumnData(1, 4).then((afterSearch) => {
      expect(afterSearch).to.eq("Chicken Sandwich");
    });
    table.RemoveFilterNVerify("2381224")
  });

  it("8. Verify Table Filter for 'ends with' - on wrong column", function () {
    table.ReadTableRowColumnData(1, 4).then((afterSearch) => {
      expect(afterSearch).to.eq("Tuna Salad");
    });
    table.FilterTable("userName", "ends with", "WICH")
    table.WaitForTableEmpty()
    table.RemoveFilterNVerify("2381224")
  });

  it("9. Verify Table Filter for 'is exactly' - case sensitive", function () {
    table.ReadTableRowColumnData(2, 4).then((afterSearch) => {
      expect(afterSearch).to.eq("Beef steak");
    });
    table.FilterTable("productName", "is exactly", "Beef steak")
    table.ReadTableRowColumnData(0, 4).then((afterSearch) => {
      expect(afterSearch).to.eq("Beef steak");
    });
    table.RemoveFilterNVerify("2381224", true)
  });

  it("10. Verify Table Filter for 'is exactly' - case insensitive", function () {
    table.ReadTableRowColumnData(2, 4).then((afterSearch) => {
      expect(afterSearch).to.eq("Beef steak");
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
    table.ReadTableRowColumnData(4, 5).then((afterSearch) => {
      expect(afterSearch).to.eq("7.99");
    });
    table.FilterTable("orderAmount", "not empty")
    table.ReadTableRowColumnData(4, 5).then((afterSearch) => {
      expect(afterSearch).to.eq("7.99");
    });
    table.RemoveFilterNVerify("2381224")
  });

  it("12. Verify Table Filter for OR operator - different row match", function () {

    table.ReadTableRowColumnData(2, 3).then((afterSearch) => {
      expect(afterSearch).to.eq("Tobias Funke");
    });

    table.FilterTable("email", "contains", "on")
    table.ReadTableRowColumnData(2, 3).then((afterSearch) => {
      expect(afterSearch).to.eq("Byron Fields");
    });
    table.FilterTable("productName", "ends with", "steak", 'OR', 1)//need not pass index 1st time
    table.ReadTableRowColumnData(2, 3).then((afterSearch) => {
      expect(afterSearch).to.eq("Tobias Funke");
    });
    table.RemoveFilterNVerify("2381224", true, false)

  });

  it("13. Verify Table Filter for OR operator - same row match", function () {

    table.ReadTableRowColumnData(0, 3).then((afterSearch) => {
      expect(afterSearch).to.eq("Michael Lawson");
    });
    table.FilterTable("email", "contains", "hol")
    table.ReadTableRowColumnData(0, 3).then((afterSearch) => {
      expect(afterSearch).to.eq("Ryan Holmes");
    });
    table.FilterTable("userName", "starts with", "ry", 'OR', 1)
    table.ReadTableRowColumnData(0, 3).then((afterSearch) => {
      expect(afterSearch).to.eq("Ryan Holmes");
    });
    table.RemoveFilterNVerify("2381224", true, false)
  });

  it("14. Verify Table Filter for OR operator - two 'ORs'", function () {

    table.ReadTableRowColumnData(0, 3).then((afterSearch) => {
      expect(afterSearch).to.eq("Michael Lawson");
    });
    table.FilterTable("email", "starts with", "by")
    table.ReadTableRowColumnData(0, 3).then((afterSearch) => {
      expect(afterSearch).to.eq("Byron Fields");
    });
    table.FilterTable("productName", "ends with", "ni", 'OR', 1)
    table.ReadTableRowColumnData(1, 3).then((afterSearch) => {
      expect(afterSearch).to.eq("Ryan Holmes");
    });
    table.FilterTable("userName", "contains", "law", 'OR', 2)
    table.ReadTableRowColumnData(0, 3).then((afterSearch) => {
      expect(afterSearch).to.eq("Michael Lawson");
    });
    table.RemoveFilterNVerify("2381224", true, false)
  });

});

