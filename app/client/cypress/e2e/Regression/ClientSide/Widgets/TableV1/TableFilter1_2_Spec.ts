import * as _ from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

describe(
  "Verify various Table_Filter combinations",
  { tags: ["@tag.Widget", "@tag.Table", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("tablev1NewDsl");
    });

    it("1. Verify Table Filter for 'empty'", function () {
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      _.propPane.UpdatePropertyFieldValue(
        "Table data",
        JSON.stringify(this.dataSet.TableInput),
      );
      _.assertHelper.AssertNetworkStatus("@updateLayout", 200);
      _.agHelper.PressEscape();
      _.deployMode.DeployApp();

      _.table.OpenNFilterTable("email", "empty");
      _.table.WaitForTableEmpty();
      _.table.RemoveFilterNVerify("2381224");
    });

    it("2. Verify Table Filter for 'not empty'", function () {
      _.table.ReadTableRowColumnData(4, 5).then(($cellData) => {
        expect($cellData).to.eq("7.99");
      });
      _.table.OpenNFilterTable("orderAmount", "not empty");
      _.table.ReadTableRowColumnData(4, 5).then(($cellData) => {
        expect($cellData).to.eq("7.99");
      });
      _.table.RemoveFilterNVerify("2381224");
    });

    it("3. Verify Table Filter - Where Edit - Change condition along with input value", function () {
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

    it("4. Verify Table Filter - Where Edit - Single Column, Condition & input value", function () {
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

    it("5. Verify Table Filter for OR operator - different row match", function () {
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

    it("6. Verify Table Filter for OR operator - same row match", function () {
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

    it("7. Verify Table Filter for OR operator - two 'ORs'", function () {
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

    it("8. Verify Table Filter for AND operator - different row match", function () {
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

    it("9. Verify Table Filter for AND operator - same row match", function () {
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

    it("10. Verify Table Filter for AND operator - same row match - edit input text value", function () {
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
  },
);
