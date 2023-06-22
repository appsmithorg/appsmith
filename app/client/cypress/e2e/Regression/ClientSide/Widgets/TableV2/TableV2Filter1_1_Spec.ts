import * as _ from "../../../../../support/Objects/ObjectsCore";

describe("Verify various Table_Filter combinations", function () {
  it("1. Adding Data to Table Widget", function () {
    _.entityExplorer.DragDropWidgetNVerify("tablewidgetv2", 650, 250);
    //_.propPane.EnterJSContext("Table data", JSON.stringify(this.dataSet.TableInput));
    _.table.AddSampleTableData();
    //_.propPane.EnterJSContext("Table Data", JSON.stringify(this.dataSet.TableInput));
    _.propPane.UpdatePropertyFieldValue(
      "Table data",
      JSON.stringify(this.dataSet.TableInput),
    );
    _.assertHelper.AssertNetworkStatus("@updateLayout", 200);
    cy.get("body").type("{esc}");
    /*
      Changing id and orderAmount to "Plain text" column type
      so that the tests that depend on id and orderAmount
      being "Plain text" type do not fail.
      From this PR onwards columns with number data (like id and orderAmount here)
      will be auto-assigned as "NUMBER" type column
    */
    _.table.ChangeColumnType("id", "Plain text", "v2");
    _.table.ChangeColumnType("orderAmount", "Plain text", "v2");

    _.deployMode.DeployApp();
  });

  it("2. Table Widget Search Functionality", function () {
    _.table.ReadTableRowColumnData(1, 3, "v2").then((cellData) => {
      expect(cellData).to.eq("Lindsay Ferguson");
      _.table.SearchTable(cellData);
      _.table.ReadTableRowColumnData(0, 3, "v2").then((afterSearch) => {
        expect(afterSearch).to.eq("Lindsay Ferguson");
      });
    });
    _.table.RemoveSearchTextNVerify("2381224", "v2");

    _.table.SearchTable("7434532");
    _.table.ReadTableRowColumnData(0, 3, "v2").then((afterSearch) => {
      expect(afterSearch).to.eq("Byron Fields");
    });
    _.table.RemoveSearchTextNVerify("2381224", "v2");
  });

  it("3. Verify Table Filter for 'contain'", function () {
    _.table.OpenNFilterTable("userName", "contains", "Lindsay");
    _.table.ReadTableRowColumnData(0, 3, "v2").then(($cellData) => {
      expect($cellData).to.eq("Lindsay Ferguson");
    });
    _.table.RemoveFilterNVerify("2381224", true, true, 0, "v2");
  });

  it("4. Verify Table Filter for 'does not contain'", function () {
    _.table.ReadTableRowColumnData(1, 4, "v2").then(($cellData) => {
      expect($cellData).to.eq("Tuna Salad");
    });
    _.table.OpenNFilterTable("productName", "does not contain", "Tuna");
    _.table.ReadTableRowColumnData(1, 4, "v2").then(($cellData) => {
      expect($cellData).to.eq("Beef steak");
    });
    _.table.RemoveFilterNVerify("2381224", true, true, 0, "v2");
  });

  it("5. Verify Table Filter for 'starts with'", function () {
    _.table.ReadTableRowColumnData(4, 4, "v2").then(($cellData) => {
      expect($cellData).to.eq("Avocado Panini");
    });
    _.table.OpenNFilterTable("productName", "starts with", "Avo");
    _.table.ReadTableRowColumnData(0, 4, "v2").then(($cellData) => {
      expect($cellData).to.eq("Avocado Panini");
    });
    _.table.RemoveFilterNVerify("2381224", true, true, 0, "v2");
  });

  it("6. Verify Table Filter for 'ends with' - case sensitive", function () {
    _.table.ReadTableRowColumnData(1, 4, "v2").then(($cellData) => {
      expect($cellData).to.eq("Tuna Salad");
    });
    _.table.OpenNFilterTable("productName", "ends with", "wich");
    _.table.ReadTableRowColumnData(1, 4, "v2").then(($cellData) => {
      expect($cellData).to.eq("Chicken Sandwich");
    });
    _.table.RemoveFilterNVerify("2381224", true, true, 0, "v2");
  });

  it("7. Verify Table Filter for 'ends with' - case insenstive", function () {
    _.table.ReadTableRowColumnData(1, 4, "v2").then(($cellData) => {
      expect($cellData).to.eq("Tuna Salad");
    });
    _.table.OpenNFilterTable("productName", "ends with", "WICH");
    _.table.ReadTableRowColumnData(1, 4, "v2").then(($cellData) => {
      expect($cellData).to.eq("Chicken Sandwich");
    });
    _.table.RemoveFilterNVerify("2381224", true, true, 0, "v2");
  });

  it("8. Verify Table Filter for 'ends with' - on wrong column", function () {
    _.table.ReadTableRowColumnData(1, 4, "v2").then(($cellData) => {
      expect($cellData).to.eq("Tuna Salad");
    });
    _.table.OpenNFilterTable("userName", "ends with", "WICH");
    _.table.WaitForTableEmpty("v2");
    _.table.RemoveFilterNVerify("2381224", true, true, 0, "v2");
  });

  it("9. Verify Table Filter for 'is exactly' - case sensitive", function () {
    _.table.ReadTableRowColumnData(2, 4, "v2").then(($cellData) => {
      expect($cellData).to.eq("Beef steak");
    });
    _.table.OpenNFilterTable("productName", "is exactly", "Beef steak");
    _.table.ReadTableRowColumnData(0, 4, "v2").then(($cellData) => {
      expect($cellData).to.eq("Beef steak");
    });
    _.table.RemoveFilterNVerify("2381224", true, true, 0, "v2");
  });

  it("10. Verify Table Filter for 'is exactly' - case insensitive", function () {
    _.table.ReadTableRowColumnData(2, 4, "v2").then(($cellData) => {
      expect($cellData).to.eq("Beef steak");
    });
    _.table.OpenNFilterTable("productName", "is exactly", "Beef STEAK");
    _.table.WaitForTableEmpty("v2");
    _.table.RemoveFilterNVerify("2381224", true, true, 0, "v2");
  });
});
