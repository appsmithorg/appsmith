import * as _ from "../../../../../support/Objects/ObjectsCore";

describe("Verify various Table_Filter combinations", function () {
  before(() => {
    cy.fixture("tablev1NewDsl").then((val: any) => {
      _.agHelper.AddDsl(val);
    });
  });

  it("1. Adding Data to Table Widget", function () {
    _.entityExplorer.SelectEntityByName("Table1");
    _.propPane.UpdatePropertyFieldValue(
      "Table data",
      JSON.stringify(this.dataSet.TableInput),
    );
    _.agHelper.AssertNetworkStatus("@updateLayout", 200);
    _.agHelper.PressEscape();
    _.deployMode.DeployApp();
  });

  it("2. Table Widget Search Functionality", function () {
    _.table.ReadTableRowColumnData(1, 3, "v1", 2000).then((cellData) => {
      expect(cellData).to.eq("Lindsay Ferguson");
      _.table.SearchTable(cellData);
      _.table.ReadTableRowColumnData(0, 3).then((afterSearch) => {
        expect(afterSearch).to.eq("Lindsay Ferguson");
      });
    });
    _.table.RemoveSearchTextNVerify("2381224");

    _.table.SearchTable("7434532");
    _.table.ReadTableRowColumnData(0, 3).then((afterSearch) => {
      expect(afterSearch).to.eq("Byron Fields");
    });
    _.table.RemoveSearchTextNVerify("2381224");
  });

  it("3. Verify Table Filter for 'contain'", function () {
    _.table.OpenNFilterTable("userName", "contains", "Lindsay");
    _.table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Lindsay Ferguson");
    });
    _.table.RemoveFilterNVerify("2381224");
  });

  it("4. Verify Table Filter for 'does not contain'", function () {
    _.table.ReadTableRowColumnData(1, 4).then(($cellData) => {
      expect($cellData).to.eq("Tuna Salad");
    });
    _.table.OpenNFilterTable("productName", "does not contain", "Tuna");
    _.table.ReadTableRowColumnData(1, 4).then(($cellData) => {
      expect($cellData).to.eq("Beef steak");
    });
    _.table.RemoveFilterNVerify("2381224");
  });

  it("5. Verify Table Filter for 'starts with'", function () {
    _.table.ReadTableRowColumnData(4, 4).then(($cellData) => {
      expect($cellData).to.eq("Avocado Panini");
    });
    _.table.OpenNFilterTable("productName", "starts with", "Avo");
    _.table.ReadTableRowColumnData(0, 4).then(($cellData) => {
      expect($cellData).to.eq("Avocado Panini");
    });
    _.table.RemoveFilterNVerify("2381224");
  });

  it("6. Verify Table Filter for 'ends with' - case sensitive", function () {
    _.table.ReadTableRowColumnData(1, 4).then(($cellData) => {
      expect($cellData).to.eq("Tuna Salad");
    });
    _.table.OpenNFilterTable("productName", "ends with", "wich");
    _.table.ReadTableRowColumnData(1, 4).then(($cellData) => {
      expect($cellData).to.eq("Chicken Sandwich");
    });
    _.table.RemoveFilterNVerify("2381224");
  });

  it("7. Verify Table Filter for 'ends with' - case insenstive", function () {
    _.table.ReadTableRowColumnData(1, 4).then(($cellData) => {
      expect($cellData).to.eq("Tuna Salad");
    });
    _.table.OpenNFilterTable("productName", "ends with", "WICH");
    _.table.ReadTableRowColumnData(1, 4).then(($cellData) => {
      expect($cellData).to.eq("Chicken Sandwich");
    });
    _.table.RemoveFilterNVerify("2381224");
  });

  it("8. Verify Table Filter for 'ends with' - on wrong column", function () {
    _.table.ReadTableRowColumnData(1, 4).then(($cellData) => {
      expect($cellData).to.eq("Tuna Salad");
    });
    _.table.OpenNFilterTable("userName", "ends with", "WICH");
    _.table.WaitForTableEmpty();
    _.table.RemoveFilterNVerify("2381224");
  });

  it("9. Verify Table Filter for 'is exactly' - case sensitive", function () {
    _.table.ReadTableRowColumnData(2, 4).then(($cellData) => {
      expect($cellData).to.eq("Beef steak");
    });
    _.table.OpenNFilterTable("productName", "is exactly", "Beef steak");
    _.table.ReadTableRowColumnData(0, 4).then(($cellData) => {
      expect($cellData).to.eq("Beef steak");
    });
    _.table.RemoveFilterNVerify("2381224", true);
  });

  it("10. Verify Table Filter for 'is exactly' - case insensitive", function () {
    _.table.ReadTableRowColumnData(2, 4).then(($cellData) => {
      expect($cellData).to.eq("Beef steak");
    });
    _.table.OpenNFilterTable("productName", "is exactly", "Beef STEAK");
    _.table.WaitForTableEmpty();
    _.table.RemoveFilterNVerify("2381224", true);
  });

  it("11. Verify Table Filter for 'empty'", function () {
    _.table.OpenNFilterTable("email", "empty");
    _.table.WaitForTableEmpty();
    _.table.RemoveFilterNVerify("2381224");
  });

  it("12. Verify Table Filter for 'not empty'", function () {
    _.table.ReadTableRowColumnData(4, 5).then(($cellData) => {
      expect($cellData).to.eq("7.99");
    });
    _.table.OpenNFilterTable("orderAmount", "not empty");
    _.table.ReadTableRowColumnData(4, 5).then(($cellData) => {
      expect($cellData).to.eq("7.99");
    });
    _.table.RemoveFilterNVerify("2381224");
  });

  it("13. Verify Table Filter - Where Edit - Change condition along with input value", function () {
    _.table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Michael Lawson");
    });

    _.table.OpenNFilterTable("orderAmount", "is exactly", "4.99");
    _.table.ReadTableRowColumnData(1, 3).then(($cellData) => {
      expect($cellData).to.eq("Byron Fields");
    });

    //Change condition - 1st time
    _.agHelper.GetNClick(_.table._filterConditionDropdown);
    cy.get(_.table._dropdownText).contains("empty").click();
    _.agHelper.ClickButton("APPLY");
    _.table.WaitForTableEmpty();

    //Change condition - 2nd time
    _.agHelper.GetNClick(_.table._filterConditionDropdown);
    cy.get(_.table._dropdownText).contains("contains").click();
    _.agHelper.GetNClick(_.table._filterInputValue, 0).type("19").wait(500);
    _.agHelper.ClickButton("APPLY");
    _.table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Tobias Funke");
    });
    _.table.RemoveFilterNVerify("2381224", true, false);
  });

  it("14. Verify Table Filter - Where Edit - Single Column, Condition & input value", function () {
    _.table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Michael Lawson");
    });

    _.table.OpenNFilterTable("productName", "contains", "e");
    _.table.ReadTableRowColumnData(0, 4).then(($cellData) => {
      expect($cellData).to.eq("Chicken Sandwich");
    });
    _.table.ReadTableRowColumnData(1, 4, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("Beef steak");
    });
    _.table.ReadTableRowColumnData(2, 4, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("Chicken Sandwich");
    });

    //Change condition - 1st time
    _.agHelper.GetNClick(_.table._filterConditionDropdown);
    cy.get(_.table._dropdownText).contains("does not contain").click();
    _.agHelper.ClickButton("APPLY");
    _.table.ReadTableRowColumnData(0, 4).then(($cellData) => {
      expect($cellData).to.eq("Tuna Salad");
    });
    _.table.ReadTableRowColumnData(1, 4).then(($cellData) => {
      expect($cellData).to.eq("Avocado Panini");
    });

    //Change condition - column value
    _.agHelper.GetNClick(_.table._filterColumnsDropdown);
    cy.get(_.table._dropdownText).contains("userName").click();
    _.agHelper.GetNClick(_.table._filterConditionDropdown);
    cy.get(_.table._dropdownText).contains("does not contain").click();
    _.agHelper.ClickButton("APPLY");
    _.table.WaitForTableEmpty();

    //Change input value
    _.agHelper
      .GetNClick(_.table._filterInputValue, 0)
      .clear()
      .type("i")
      .wait(500);
    _.agHelper.ClickButton("APPLY");
    _.table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Ryan Holmes");
    });

    _.table.RemoveFilterNVerify("2381224", true, false);
  });

  it("15. Verify Table Filter for OR operator - different row match", function () {
    _.table.ReadTableRowColumnData(2, 3).then(($cellData) => {
      expect($cellData).to.eq("Tobias Funke");
    });

    _.table.OpenNFilterTable("email", "contains", "on");
    _.table.ReadTableRowColumnData(2, 3).then(($cellData) => {
      expect($cellData).to.eq("Byron Fields");
    });
    _.table.OpenNFilterTable("productName", "ends with", "steak", "OR", 1);
    _.table.ReadTableRowColumnData(2, 3).then(($cellData) => {
      expect($cellData).to.eq("Tobias Funke");
    });
    _.table.RemoveFilterNVerify("2381224", true, false);
  });

  it("16. Verify Table Filter for OR operator - same row match", function () {
    _.table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Michael Lawson");
    });
    _.table.OpenNFilterTable("email", "contains", "hol");
    _.table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Ryan Holmes");
    });
    _.table.OpenNFilterTable("userName", "starts with", "ry", "OR", 1);
    _.table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Ryan Holmes");
    });
    _.table.RemoveFilterNVerify("2381224", true, false);
  });

  it("17. Verify Table Filter for OR operator - two 'ORs'", function () {
    _.table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Michael Lawson");
    });
    _.table.OpenNFilterTable("email", "starts with", "by");
    _.table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Byron Fields");
    });
    _.table.OpenNFilterTable("productName", "ends with", "ni", "OR", 1);
    _.table.ReadTableRowColumnData(1, 3).then(($cellData) => {
      expect($cellData).to.eq("Ryan Holmes");
    });
    _.table.OpenNFilterTable("userName", "contains", "law", "OR", 2);
    _.table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Michael Lawson");
    });
    _.table.RemoveFilterNVerify("2381224", true, false);
  });

  it("18. Verify Table Filter for AND operator - different row match", function () {
    _.table.ReadTableRowColumnData(3, 3).then(($cellData) => {
      expect($cellData).to.eq("Byron Fields");
    });
    _.table.OpenNFilterTable("userName", "starts with", "b");
    _.table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Byron Fields");
    });
    _.table.OpenNFilterTable(
      "productName",
      "does not contain",
      "WICH",
      "AND",
      1,
    );
    _.table.WaitForTableEmpty();
    _.table.RemoveFilterNVerify("2381224", true, false);
  });

  it("19. Verify Table Filter for AND operator - same row match", function () {
    _.table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Michael Lawson");
    });
    _.table.OpenNFilterTable("userName", "ends with", "s");
    _.table.ReadTableRowColumnData(1, 3).then(($cellData) => {
      expect($cellData).to.eq("Ryan Holmes");
    });
    _.table.OpenNFilterTable("orderAmount", "is exactly", "4.99", "AND", 1);
    _.table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Byron Fields");
    });
    _.table.RemoveFilterNVerify("2381224", true, false);
  });

  it("20. Verify Table Filter for AND operator - same row match - edit input text value", function () {
    _.table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Michael Lawson");
    });
    _.table.OpenNFilterTable("userName", "ends with", "s");
    _.table.ReadTableRowColumnData(1, 3).then(($cellData) => {
      expect($cellData).to.eq("Ryan Holmes");
    });
    _.table.OpenNFilterTable("orderAmount", "is exactly", "4.99", "AND", 1);
    _.table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Byron Fields");
    });
    _.agHelper
      .GetNClick(_.table._filterInputValue, 1)
      .clear()
      .type("7.99")
      .wait(500);
    _.agHelper.ClickButton("APPLY");
    _.table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Ryan Holmes");
    });
    _.table.RemoveFilterNVerify("2381224", true, false);
  });
});
