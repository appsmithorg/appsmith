import {
  agHelper,
  locators,
  entityExplorer,
  propPane,
  deployMode,
  table,
  draggableWidgets,
  assertHelper,
} from "../../../../../support/Objects/ObjectsCore";

describe(
  "Verify various Table_Filter combinations",
  { tags: ["@tag.All", "@tag.Table", "@tag.Binding"] },
  function () {
    it("1. Verify Table Filter for 'empty'", function () {
      entityExplorer.DragDropWidgetNVerify("tablewidgetv2", 650, 250);
      // turn on filtering for the table - it is disabled by default in this PR(#34593)
      propPane.ExpandIfCollapsedSection("search\\&filters");
      agHelper.GetNClick(".t--property-control-allowfiltering input");
      table.AddSampleTableData();
      propPane.UpdatePropertyFieldValue(
        "Table data",
        JSON.stringify(this.dataSet.TableInput),
      );
      assertHelper.AssertNetworkStatus("@updateLayout", 200);
      agHelper.PressEscape();
      table.ChangeColumnType("id", "Plain text", "v2");
      table.ChangeColumnType("orderAmount", "Plain text", "v2");

      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.TABLE));
      table.WaitUntilTableLoad(0, 0, "v2");

      table.OpenNFilterTable("email", "empty");
      agHelper.Sleep(2000); //table to filter & records to disappear
      table.WaitForTableEmpty("v2");
      table.RemoveFilterNVerify("2381224", true, true, 0, "v2");
    });

    it("2. Verify Table Filter for 'not empty'", function () {
      table.ReadTableRowColumnData(4, 5, "v2").then(($cellData) => {
        expect($cellData).to.eq("7.99");
      });
      table.OpenNFilterTable("orderAmount", "not empty");
      table.ReadTableRowColumnData(4, 5, "v2").then(($cellData) => {
        expect($cellData).to.eq("7.99");
      });
      table.RemoveFilterNVerify("2381224", true, true, 0, "v2");
    });

    it("3. Verify Table Filter - Where Edit - Change condition along with input value", function () {
      table.ReadTableRowColumnData(0, 3, "v2").then(($cellData) => {
        expect($cellData).to.eq("Michael Lawson");
      });

      table.OpenNFilterTable("orderAmount", "is exactly", "4.99");
      table.ReadTableRowColumnData(1, 3, "v2").then(($cellData) => {
        expect($cellData).to.eq("Byron Fields");
      });

      //Change condition - 1st time
      agHelper.GetNClick(table._filterConditionDropdown);
      cy.get(table._dropdownText).contains("empty").click();
      agHelper.ClickButton("APPLY");
      table.WaitForTableEmpty("v2");

      //Change condition - 2nd time
      agHelper.GetNClick(table._filterConditionDropdown);
      cy.get(table._dropdownText).contains("contains").click();
      agHelper.GetNClick(table._filterInputValue, 0).type("19").wait(500);
      agHelper.ClickButton("APPLY");
      table.ReadTableRowColumnData(0, 3, "v2").then(($cellData) => {
        expect($cellData).to.eq("Tobias Funke");
      });
      table.RemoveFilterNVerify("2381224", true, false, 0, "v2");
    });

    it("4. Verify Table Filter - Where Edit - Single Column, Condition & input value", function () {
      table.ReadTableRowColumnData(0, 3, "v2").then(($cellData) => {
        expect($cellData).to.eq("Michael Lawson");
      });

      table.OpenNFilterTable("productName", "contains", "e");
      table.ReadTableRowColumnData(0, 4, "v2").then(($cellData) => {
        expect($cellData).to.eq("Chicken Sandwich");
      });
      table.ReadTableRowColumnData(1, 4, "v2", 200).then(($cellData) => {
        expect($cellData).to.eq("Beef steak");
      });
      table.ReadTableRowColumnData(2, 4, "v2", 200).then(($cellData) => {
        expect($cellData).to.eq("Chicken Sandwich");
      });

      //Change condition - 1st time
      agHelper.GetNClick(table._filterConditionDropdown);
      cy.get(table._dropdownText).contains("does not contain").click();
      agHelper.ClickButton("APPLY");
      table.ReadTableRowColumnData(0, 4, "v2").then(($cellData) => {
        expect($cellData).to.eq("Tuna Salad");
      });
      table.ReadTableRowColumnData(1, 4, "v2").then(($cellData) => {
        expect($cellData).to.eq("Avocado Panini");
      });

      //Change condition - column value
      agHelper.GetNClick(table._filterColumnsDropdown);
      cy.get(table._dropdownText).contains("userName").click();
      agHelper.GetNClick(table._filterConditionDropdown);
      cy.get(table._dropdownText).contains("does not contain").click();
      agHelper.ClickButton("APPLY");
      table.WaitForTableEmpty("v2");

      //Change input value
      agHelper
        .GetNClick(table._filterInputValue, 0)
        .clear()
        .type("i")
        .wait(500);
      agHelper.ClickButton("APPLY");
      table.ReadTableRowColumnData(0, 3, "v2").then(($cellData) => {
        expect($cellData).to.eq("Ryan Holmes");
      });

      table.RemoveFilterNVerify("2381224", true, false, 0, "v2");
    });

    it("5. Verify Table Filter for OR operator - different row match", function () {
      table.ReadTableRowColumnData(2, 3, "v2").then(($cellData) => {
        expect($cellData).to.eq("Tobias Funke");
      });

      table.OpenNFilterTable("email", "contains", "on");
      table.ReadTableRowColumnData(2, 3, "v2").then(($cellData) => {
        expect($cellData).to.eq("Byron Fields");
      });
      table.OpenNFilterTable("productName", "ends with", "steak", "OR", 1);
      table.ReadTableRowColumnData(2, 3, "v2").then(($cellData) => {
        expect($cellData).to.eq("Tobias Funke");
      });
      table.RemoveFilterNVerify("2381224", true, false, 0, "v2");
    });

    it("6. Verify Table Filter for OR operator - same row match", function () {
      table.ReadTableRowColumnData(0, 3, "v2").then(($cellData) => {
        expect($cellData).to.eq("Michael Lawson");
      });
      table.OpenNFilterTable("email", "contains", "hol");
      table.ReadTableRowColumnData(0, 3, "v2").then(($cellData) => {
        expect($cellData).to.eq("Ryan Holmes");
      });
      table.OpenNFilterTable("userName", "starts with", "ry", "OR", 1);
      table.ReadTableRowColumnData(0, 3, "v2").then(($cellData) => {
        expect($cellData).to.eq("Ryan Holmes");
      });
      table.RemoveFilterNVerify("2381224", true, false, 0, "v2");
    });

    it("7. Verify Table Filter for OR operator - two 'ORs'", function () {
      table.ReadTableRowColumnData(0, 3, "v2").then(($cellData) => {
        expect($cellData).to.eq("Michael Lawson");
      });
      table.OpenNFilterTable("email", "starts with", "by");
      table.ReadTableRowColumnData(0, 3, "v2").then(($cellData) => {
        expect($cellData).to.eq("Byron Fields");
      });
      table.OpenNFilterTable("productName", "ends with", "ni", "OR", 1);
      table.ReadTableRowColumnData(1, 3, "v2").then(($cellData) => {
        expect($cellData).to.eq("Ryan Holmes");
      });
      table.OpenNFilterTable("userName", "contains", "law", "OR", 2);
      table.ReadTableRowColumnData(0, 3, "v2").then(($cellData) => {
        expect($cellData).to.eq("Michael Lawson");
      });
      table.RemoveFilterNVerify("2381224", true, false, 0, "v2");
    });

    it("8. Verify Table Filter for AND operator - different row match", function () {
      table.ReadTableRowColumnData(3, 3, "v2").then(($cellData) => {
        expect($cellData).to.eq("Byron Fields");
      });
      table.OpenNFilterTable("userName", "starts with", "b");
      table.ReadTableRowColumnData(0, 3, "v2").then(($cellData) => {
        expect($cellData).to.eq("Byron Fields");
      });
      table.OpenNFilterTable(
        "productName",
        "does not contain",
        "WICH",
        "AND",
        1,
      );
      table.WaitForTableEmpty("v2");
      table.RemoveFilterNVerify("2381224", true, false, 0, "v2");
    });

    it("9. Verify Table Filter for AND operator - same row match", function () {
      table.ReadTableRowColumnData(0, 3, "v2").then(($cellData) => {
        expect($cellData).to.eq("Michael Lawson");
      });
      table.OpenNFilterTable("userName", "ends with", "s");
      table.ReadTableRowColumnData(1, 3, "v2").then(($cellData) => {
        expect($cellData).to.eq("Ryan Holmes");
      });
      table.OpenNFilterTable("orderAmount", "is exactly", "4.99", "AND", 1);
      table.ReadTableRowColumnData(0, 3, "v2").then(($cellData) => {
        expect($cellData).to.eq("Byron Fields");
      });
      table.RemoveFilterNVerify("2381224", true, false, 0, "v2");
    });

    it("10. Verify Table Filter for AND operator - same row match - edit input text value", function () {
      table.ReadTableRowColumnData(0, 3, "v2").then(($cellData) => {
        expect($cellData).to.eq("Michael Lawson");
      });
      table.OpenNFilterTable("userName", "ends with", "s");
      table.ReadTableRowColumnData(1, 3, "v2").then(($cellData) => {
        expect($cellData).to.eq("Ryan Holmes");
      });
      table.OpenNFilterTable("orderAmount", "is exactly", "4.99", "AND", 1);
      table.ReadTableRowColumnData(0, 3, "v2").then(($cellData) => {
        expect($cellData).to.eq("Byron Fields");
      });
      agHelper
        .GetNClick(table._filterInputValue, 1)
        .clear()
        .type("7.99")
        .wait(500);
      agHelper.ClickButton("APPLY");
      table.ReadTableRowColumnData(0, 3, "v2").then(($cellData) => {
        expect($cellData).to.eq("Ryan Holmes");
      });
      table.RemoveFilterNVerify("2381224", true, false, 0, "v2");
    });
  },
);
