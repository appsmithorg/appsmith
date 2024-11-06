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

    it("1. Adding Data to Table Widget", function () {
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      _.propPane.UpdatePropertyFieldValue(
        "Table data",
        JSON.stringify(this.dataSet.TableInput),
      );
      _.assertHelper.AssertNetworkStatus("@updateLayout", 200);
      _.agHelper.PressEscape();
      _.deployMode.DeployApp();
    });

    it("2. Verify Table Filter for AND operator - same row match - Where Edit - input value", function () {
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

    it("3. Verify Table Filter for AND operator - two 'ANDs' - clearAll", function () {
      _.table.ReadTableRowColumnData(0, 3).then(($cellData) => {
        expect($cellData).to.eq("Michael Lawson");
      });
      _.table.OpenNFilterTable("id", "contains", "7434532");
      _.table.ReadTableRowColumnData(1, 3).then(($cellData) => {
        expect($cellData).to.eq("Ryan Holmes");
      });
      _.table.OpenNFilterTable("productName", "contains", "i", "AND", 1);
      _.table.ReadTableRowColumnData(0, 3).then(($cellData) => {
        expect($cellData).to.eq("Byron Fields");
      });
      _.table.OpenNFilterTable("orderAmount", "starts with", "7", "AND", 2);
      _.table.ReadTableRowColumnData(0, 3).then(($cellData) => {
        expect($cellData).to.eq("Ryan Holmes");
      });
      _.table.RemoveFilterNVerify("2381224", true, false);
    });

    it("4. Verify Table Filter for AND operator - two 'ANDs' - removeOne filter condition + Bug 12638", function () {
      _.table.OpenNFilterTable("id", "contains", "2");
      _.table.ReadTableRowColumnData(1, 3).then(($cellData) => {
        expect($cellData).to.eq("Lindsay Ferguson");
      });
      _.table.OpenNFilterTable("productName", "ends with", "WICH", "AND", 1);
      _.table.ReadTableRowColumnData(0, 3).then(($cellData) => {
        expect($cellData).to.eq("Michael Lawson");
      });
      _.table.OpenNFilterTable("userName", "does not contain", "son", "AND", 2);
      _.table.ReadTableRowColumnData(0, 3).then(($cellData) => {
        expect($cellData).to.eq("Byron Fields");
      });
      _.table.RemoveFilterNVerify("7434532", false, true, 1);
      //Bug 12638
      _.table.ReadTableRowColumnData(1, 3).then(($cellData) => {
        expect($cellData).to.eq("Ryan Holmes");
      });
      _.table.RemoveFilterNVerify("2381224", true, false);
    });

    it("5. Verify Table Filter for AND operator - two 'ANDs' - removeOne filter twice + Bug 12638", function () {
      _.table.OpenNFilterTable("id", "starts with", "2");
      _.table.ReadTableRowColumnData(1, 3).then(($cellData) => {
        expect($cellData).to.eq("Lindsay Ferguson");
      });
      _.table.OpenNFilterTable("productName", "ends with", "WICH", "AND", 1);
      _.table.ReadTableRowColumnData(0, 3).then(($cellData) => {
        expect($cellData).to.eq("Michael Lawson");
      });
      _.table.OpenNFilterTable("userName", "contains", "on", "AND", 2);
      _.table.ReadTableRowColumnData(0, 3).then(($cellData) => {
        expect($cellData).to.eq("Michael Lawson");
      });
      _.table.RemoveFilterNVerify("2381224", false, true, 1);
      _.table.RemoveFilterNVerify("2381224", false, true, 0);

      //Bug 12638 - verification to add here - once closed

      _.table.ReadTableRowColumnData(1, 3).then(($cellData) => {
        expect($cellData).to.eq("Lindsay Ferguson");
      });
      _.table.RemoveFilterNVerify("2381224", true, false);
    });

    it("6. Verify Table Filter for changing from AND -> OR -> AND", function () {
      _.table.OpenNFilterTable("id", "contains", "7");
      _.table.ReadTableRowColumnData(1, 4).then(($cellData) => {
        expect($cellData).to.eq("Beef steak");
      });
      _.table.OpenNFilterTable("productName", "contains", "I", "AND", 1);
      _.table.ReadTableRowColumnData(1, 4).then(($cellData) => {
        expect($cellData).to.eq("Avocado Panini");
      });
      _.table.OpenNFilterTable("userName", "starts with", "r", "AND", 2);
      _.table.ReadTableRowColumnData(0, 4).then(($cellData) => {
        expect($cellData).to.eq("Avocado Panini");
      });

      _.agHelper.GetNClick(_.table._filterOperatorDropdown);
      cy.get(_.table._dropdownText).contains("OR").click();
      _.agHelper.ClickButton("APPLY");

      _.table.ReadTableRowColumnData(1, 4).then(($cellData) => {
        expect($cellData).to.eq("Tuna Salad");
      });

      _.agHelper.GetNClick(_.table._filterOperatorDropdown);
      cy.get(_.table._dropdownText).contains("AND").click();
      _.agHelper.ClickButton("APPLY");

      _.table.ReadTableRowColumnData(0, 4).then(($cellData) => {
        expect($cellData).to.eq("Avocado Panini");
      });
      _.table.RemoveFilterNVerify("2381224", true, false);
    });

    it("7. Verify Table Filter for changing from AND -> OR -> along with changing Where clause condions", function () {
      _.table.OpenNFilterTable("id", "starts with", "2");
      _.table.ReadTableRowColumnData(0, 3).then(($cellData) => {
        expect($cellData).to.eq("Michael Lawson");
      });
      _.table.ReadTableRowColumnData(1, 3, "v1", 200).then(($cellData) => {
        expect($cellData).to.eq("Lindsay Ferguson");
      });

      _.table.OpenNFilterTable("orderAmount", "contains", "19", "OR", 1);
      _.table.ReadTableRowColumnData(2, 3).then(($cellData) => {
        expect($cellData).to.eq("Tobias Funke");
      });

      //Changing filter conditions of both where rows - 1st row
      _.agHelper
        .GetNClick(_.table._filterInputValue, 0)
        .clear()
        .type("7")
        .wait(500);
      _.agHelper.ClickButton("APPLY");
      _.table.ReadTableRowColumnData(0, 3).then(($cellData) => {
        expect($cellData).to.eq("Tobias Funke");
      });
      _.table.ReadTableRowColumnData(1, 3, "v1", 200).then(($cellData) => {
        expect($cellData).to.eq("Byron Fields");
      });
      _.table.ReadTableRowColumnData(2, 3, "v1", 200).then(($cellData) => {
        expect($cellData).to.eq("Ryan Holmes");
      });

      //Changing filter conditions of both where rows - 2nd row
      _.agHelper.GetNClick(_.table._filterConditionDropdown, 1);
      cy.get(_.table._dropdownText).contains("does not contain").click();
      _.agHelper.ClickButton("APPLY");
      _.table.ReadTableRowColumnData(0, 3).then(($cellData) => {
        expect($cellData).to.eq("Michael Lawson");
      });
      _.table.ReadTableRowColumnData(1, 3, "v1", 200).then(($cellData) => {
        expect($cellData).to.eq("Lindsay Ferguson");
      });
      _.table.ReadTableRowColumnData(2, 3, "v1", 200).then(($cellData) => {
        expect($cellData).to.eq("Byron Fields");
      });
      _.table.ReadTableRowColumnData(3, 3, "v1", 200).then(($cellData) => {
        expect($cellData).to.eq("Ryan Holmes");
      });

      //Changing OR to AND
      _.agHelper.GetNClick(_.table._filterOperatorDropdown);
      cy.get(_.table._dropdownText).contains("AND").click();
      _.agHelper.ClickButton("APPLY");
      _.table.ReadTableRowColumnData(0, 3).then(($cellData) => {
        expect($cellData).to.eq("Byron Fields");
      });
      _.table.ReadTableRowColumnData(1, 3, "v1", 200).then(($cellData) => {
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
      _.table.ReadTableRowColumnData(0, 3).then(($cellData) => {
        expect($cellData).to.eq("Lindsay Ferguson");
      });
      _.table.ReadTableRowColumnData(1, 3, "v1", 200).then(($cellData) => {
        expect($cellData).to.eq("Byron Fields");
      });
      _.table.ReadTableRowColumnData(2, 3, "v1", 200).then(($cellData) => {
        expect($cellData).to.eq("Ryan Holmes");
      });
      _.table.RemoveFilterNVerify("2381224", true, false);
    });

    it("8. Verify Table Filter for changing from AND -> OR [Remove a filter] -> AND + Bug 12642", function () {
      _.table.OpenNFilterTable("id", "contains", "7");
      _.table.ReadTableRowColumnData(1, 4).then(($cellData) => {
        expect($cellData).to.eq("Beef steak");
      });
      _.table.OpenNFilterTable("productName", "contains", "I", "AND", 1);
      _.table.ReadTableRowColumnData(1, 4).then(($cellData) => {
        expect($cellData).to.eq("Avocado Panini");
      });
      _.table.OpenNFilterTable("userName", "starts with", "r", "AND", 2);
      _.table.ReadTableRowColumnData(0, 4).then(($cellData) => {
        expect($cellData).to.eq("Avocado Panini");
      });

      _.agHelper.GetNClick(_.table._filterOperatorDropdown);
      cy.get(_.table._dropdownText).contains("OR").click();
      _.agHelper.ClickButton("APPLY");

      _.table.ReadTableRowColumnData(1, 4).then(($cellData) => {
        expect($cellData).to.eq("Tuna Salad");
      });

      _.table.RemoveFilterNVerify("7434532", false, true, 0); //Since TableV1 - revertion of operator upon removal of filter is not supported

      _.table.ReadTableRowColumnData(0, 4).then(($cellData) => {
        expect($cellData).to.eq("Avocado Panini");
      });
      _.table.RemoveFilterNVerify("2381224", true, false);
    });
  },
);
