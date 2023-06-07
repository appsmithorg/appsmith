import { ObjectsRegistry } from "../../../../../support/Objects/Registry";

let dataSet: any;
const agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  table = ObjectsRegistry.Table,
  deployMode = ObjectsRegistry.DeployMode,
  propPane = ObjectsRegistry.PropertyPane;

describe("Verify various Table_Filter combinations", function () {
  before(() => {
    cy.fixture("example").then(function (data: any) {
      dataSet = data;
    });
  });

  it("1. Adding Data to Table Widget", function () {
    ee.DragDropWidgetNVerify("tablewidgetv2", 650, 250);
    //propPane.EnterJSContext("Table data", JSON.stringify(dataSet.TableInput));
    table.AddSampleTableData();
    //propPane.EnterJSContext("Table Data", JSON.stringify(dataSet.TableInput));
    propPane.UpdatePropertyFieldValue(
      "Table data",
      JSON.stringify(dataSet.TableInput),
    );
    agHelper.ValidateNetworkStatus("@updateLayout", 200);
    cy.get("body").type("{esc}");
    /*
      Changing id and orderAmount to "Plain Text" column type
      so that the tests that depend on id and orderAmount
      being "Plain Text" type do not fail.
      From this PR onwards columns with number data (like id and orderAmount here)
      will be auto-assigned as "NUMBER" type column
    */
    table.ChangeColumnType("id", "Plain text", "v2");
    table.ChangeColumnType("orderAmount", "Plain text", "v2");

    deployMode.DeployApp();
  });

  it("2. Table Widget Search Functionality", function () {
    table.ReadTableRowColumnData(1, 3, "v2").then((cellData) => {
      expect(cellData).to.eq("Lindsay Ferguson");
      table.SearchTable(cellData);
      table.ReadTableRowColumnData(0, 3, "v2").then((afterSearch) => {
        expect(afterSearch).to.eq("Lindsay Ferguson");
      });
    });
    table.RemoveSearchTextNVerify("2381224", "v2");

    table.SearchTable("7434532");
    table.ReadTableRowColumnData(0, 3, "v2").then((afterSearch) => {
      expect(afterSearch).to.eq("Byron Fields");
    });
    table.RemoveSearchTextNVerify("2381224", "v2");
  });

  it("3. Verify Table Filter for 'contain'", function () {
    table.OpenNFilterTable("userName", "contains", "Lindsay");
    table.ReadTableRowColumnData(0, 3, "v2").then(($cellData) => {
      expect($cellData).to.eq("Lindsay Ferguson");
    });
    table.RemoveFilterNVerify("2381224", true, true, 0, "v2");
  });

  it("4. Verify Table Filter for 'does not contain'", function () {
    table.ReadTableRowColumnData(1, 4, "v2").then(($cellData) => {
      expect($cellData).to.eq("Tuna Salad");
    });
    table.OpenNFilterTable("productName", "does not contain", "Tuna");
    table.ReadTableRowColumnData(1, 4, "v2").then(($cellData) => {
      expect($cellData).to.eq("Beef steak");
    });
    table.RemoveFilterNVerify("2381224", true, true, 0, "v2");
  });

  it("5. Verify Table Filter for 'starts with'", function () {
    table.ReadTableRowColumnData(4, 4, "v2").then(($cellData) => {
      expect($cellData).to.eq("Avocado Panini");
    });
    table.OpenNFilterTable("productName", "starts with", "Avo");
    table.ReadTableRowColumnData(0, 4, "v2").then(($cellData) => {
      expect($cellData).to.eq("Avocado Panini");
    });
    table.RemoveFilterNVerify("2381224", true, true, 0, "v2");
  });

  it("6. Verify Table Filter for 'ends with' - case sensitive", function () {
    table.ReadTableRowColumnData(1, 4, "v2").then(($cellData) => {
      expect($cellData).to.eq("Tuna Salad");
    });
    table.OpenNFilterTable("productName", "ends with", "wich");
    table.ReadTableRowColumnData(1, 4, "v2").then(($cellData) => {
      expect($cellData).to.eq("Chicken Sandwich");
    });
    table.RemoveFilterNVerify("2381224", true, true, 0, "v2");
  });

  it("7. Verify Table Filter for 'ends with' - case insenstive", function () {
    table.ReadTableRowColumnData(1, 4, "v2").then(($cellData) => {
      expect($cellData).to.eq("Tuna Salad");
    });
    table.OpenNFilterTable("productName", "ends with", "WICH");
    table.ReadTableRowColumnData(1, 4, "v2").then(($cellData) => {
      expect($cellData).to.eq("Chicken Sandwich");
    });
    table.RemoveFilterNVerify("2381224", true, true, 0, "v2");
  });

  it("8. Verify Table Filter for 'ends with' - on wrong column", function () {
    table.ReadTableRowColumnData(1, 4, "v2").then(($cellData) => {
      expect($cellData).to.eq("Tuna Salad");
    });
    table.OpenNFilterTable("userName", "ends with", "WICH");
    table.WaitForTableEmpty("v2");
    table.RemoveFilterNVerify("2381224", true, true, 0, "v2");
  });

  it("9. Verify Table Filter for 'is exactly' - case sensitive", function () {
    table.ReadTableRowColumnData(2, 4, "v2").then(($cellData) => {
      expect($cellData).to.eq("Beef steak");
    });
    table.OpenNFilterTable("productName", "is exactly", "Beef steak");
    table.ReadTableRowColumnData(0, 4, "v2").then(($cellData) => {
      expect($cellData).to.eq("Beef steak");
    });
    table.RemoveFilterNVerify("2381224", true, true, 0, "v2");
  });

  it("10. Verify Table Filter for 'is exactly' - case insensitive", function () {
    table.ReadTableRowColumnData(2, 4, "v2").then(($cellData) => {
      expect($cellData).to.eq("Beef steak");
    });
    table.OpenNFilterTable("productName", "is exactly", "Beef STEAK");
    table.WaitForTableEmpty("v2");
    table.RemoveFilterNVerify("2381224", true, true, 0, "v2");
  });
});
