import {
  agHelper,
  entityExplorer,
  propPane,
  deployMode,
  table,
  assertHelper,
  locators,
  draggableWidgets,
} from "../../../../../support/Objects/ObjectsCore";

describe(
  "Verify various Table_Filter combinations",
  { tags: ["@tag.All", "@tag.Table", "@tag.Binding"] },
  function () {
    it("1. Adding Data to Table Widget", function () {
      entityExplorer.DragDropWidgetNVerify("tablewidgetv2", 650, 250);
      //propPane.EnterJSContext("Table data", JSON.stringify(this.dataSet.TableInput));
      // turn on filtering for the table - it is disabled by default in this PR(#34593)
      propPane.ExpandIfCollapsedSection("search\\&filters");
      agHelper.GetNClick(".t--property-control-allowfiltering input");
      table.AddSampleTableData();
      //propPane.EnterJSContext("Table Data", JSON.stringify(this.dataSet.TableInput));
      propPane.UpdatePropertyFieldValue(
        "Table data",
        JSON.stringify(this.dataSet.TableInput),
      );
      assertHelper.AssertNetworkStatus("@updateLayout", 200);
      agHelper.PressEscape();
      /*
      Changing id and orderAmount to "Plain text" column type
      so that the tests that depend on id and orderAmount
      being "Plain text" type do not fail.
      From this PR onwards columns with number data (like id and orderAmount here)
      will be auto-assigned as "NUMBER" type column
    */
      table.ChangeColumnType("id", "Plain text", "v2");
      table.ChangeColumnType("orderAmount", "Plain text", "v2");

      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.TABLE));
      table.WaitUntilTableLoad(0, 0, "v2");
    });

    it("2. Verify Table Filter for AND operator - same row match - Where Edit - input value", function () {
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

    it("3. Verify Table Filter for AND operator - two 'ANDs' - clearAll", function () {
      table.ReadTableRowColumnData(0, 3, "v2").then(($cellData) => {
        expect($cellData).to.eq("Michael Lawson");
      });
      table.OpenNFilterTable("id", "contains", "7434532");
      table.ReadTableRowColumnData(1, 3, "v2").then(($cellData) => {
        expect($cellData).to.eq("Ryan Holmes");
      });
      table.OpenNFilterTable("productName", "contains", "i", "AND", 1);
      table.ReadTableRowColumnData(0, 3, "v2").then(($cellData) => {
        expect($cellData).to.eq("Byron Fields");
      });
      table.OpenNFilterTable("orderAmount", "starts with", "7", "AND", 2);
      table.ReadTableRowColumnData(0, 3, "v2").then(($cellData) => {
        expect($cellData).to.eq("Ryan Holmes");
      });
      table.RemoveFilterNVerify("2381224", true, false, 0, "v2");
    });

    it("4. Verify Table Filter for AND operator - two 'ANDs' - removeOne filter condition + Bug 12638", function () {
      table.OpenNFilterTable("id", "contains", "2");
      table.ReadTableRowColumnData(1, 3, "v2").then(($cellData) => {
        expect($cellData).to.eq("Lindsay Ferguson");
      });
      table.OpenNFilterTable("productName", "ends with", "WICH", "AND", 1);
      table.ReadTableRowColumnData(0, 3, "v2").then(($cellData) => {
        expect($cellData).to.eq("Michael Lawson");
      });
      table.OpenNFilterTable("userName", "does not contain", "son", "AND", 2);
      table.ReadTableRowColumnData(0, 3, "v2").then(($cellData) => {
        expect($cellData).to.eq("Byron Fields");
      });
      table.RemoveFilterNVerify("7434532", false, true, 1, "v2");
      //Bug 12638
      table.ReadTableRowColumnData(1, 3, "v2").then(($cellData) => {
        expect($cellData).to.eq("Ryan Holmes");
      });
      table.RemoveFilterNVerify("2381224", true, false, 0, "v2");
    });

    it("5. Verify Table Filter for AND operator - two 'ANDs' - removeOne filter twice + Bug 12638", function () {
      table.OpenNFilterTable("id", "starts with", "2");
      table.ReadTableRowColumnData(1, 3, "v2").then(($cellData) => {
        expect($cellData).to.eq("Lindsay Ferguson");
      });
      table.OpenNFilterTable("productName", "ends with", "WICH", "AND", 1);
      table.ReadTableRowColumnData(0, 3, "v2").then(($cellData) => {
        expect($cellData).to.eq("Michael Lawson");
      });
      table.OpenNFilterTable("userName", "contains", "on", "AND", 2);
      table.ReadTableRowColumnData(0, 3, "v2").then(($cellData) => {
        expect($cellData).to.eq("Michael Lawson");
      });
      table.RemoveFilterNVerify("2381224", false, true, 1, "v2");
      table.RemoveFilterNVerify("2381224", false, true, 0, "v2");

      //Bug 12638 - verification to add here - once closed

      table.ReadTableRowColumnData(1, 3, "v2").then(($cellData) => {
        expect($cellData).to.eq("Lindsay Ferguson");
      });
      table.RemoveFilterNVerify("2381224", true, false, 0, "v2");
    });

    it("6. Verify Table Filter for changing from AND -> OR -> AND", function () {
      table.OpenNFilterTable("id", "contains", "7");
      table.ReadTableRowColumnData(1, 4, "v2").then(($cellData) => {
        expect($cellData).to.eq("Beef steak");
      });
      table.OpenNFilterTable("productName", "contains", "I", "AND", 1);
      table.ReadTableRowColumnData(1, 4, "v2").then(($cellData) => {
        expect($cellData).to.eq("Avocado Panini");
      });
      table.OpenNFilterTable("userName", "starts with", "r", "AND", 2);
      table.ReadTableRowColumnData(0, 4, "v2").then(($cellData) => {
        expect($cellData).to.eq("Avocado Panini");
      });

      agHelper.GetNClick(table._filterOperatorDropdown);
      cy.get(table._dropdownText).contains("OR").click();
      agHelper.ClickButton("APPLY");

      table.ReadTableRowColumnData(1, 4, "v2").then(($cellData) => {
        expect($cellData).to.eq("Tuna Salad");
      });

      agHelper.GetNClick(table._filterOperatorDropdown);
      cy.get(table._dropdownText).contains("AND").click();
      agHelper.ClickButton("APPLY");

      table.ReadTableRowColumnData(0, 4, "v2").then(($cellData) => {
        expect($cellData).to.eq("Avocado Panini");
      });
      table.RemoveFilterNVerify("2381224", true, false, 0, "v2");
    });

    it("7. Verify Table Filter for changing from AND -> OR -> along with changing Where clause condions", function () {
      table.OpenNFilterTable("id", "starts with", "2");
      table.ReadTableRowColumnData(0, 3, "v2").then(($cellData) => {
        expect($cellData).to.eq("Michael Lawson");
      });
      table.ReadTableRowColumnData(1, 3, "v2", 200).then(($cellData) => {
        expect($cellData).to.eq("Lindsay Ferguson");
      });

      table.OpenNFilterTable("orderAmount", "contains", "19", "OR", 1);
      table.ReadTableRowColumnData(2, 3, "v2").then(($cellData) => {
        expect($cellData).to.eq("Tobias Funke");
      });

      //Changing filter conditions of both where rows - 1st row
      agHelper
        .GetNClick(table._filterInputValue, 0)
        .clear()
        .type("7")
        .wait(500);
      agHelper.ClickButton("APPLY");
      table.ReadTableRowColumnData(0, 3, "v2").then(($cellData) => {
        expect($cellData).to.eq("Tobias Funke");
      });
      table.ReadTableRowColumnData(1, 3, "v2", 200).then(($cellData) => {
        expect($cellData).to.eq("Byron Fields");
      });
      table.ReadTableRowColumnData(2, 3, "v2", 200).then(($cellData) => {
        expect($cellData).to.eq("Ryan Holmes");
      });

      //Changing filter conditions of both where rows - 2nd row
      agHelper.GetNClick(table._filterConditionDropdown, 1);
      cy.get(table._dropdownText).contains("does not contain").click();
      agHelper.ClickButton("APPLY");
      table.ReadTableRowColumnData(0, 3, "v2").then(($cellData) => {
        expect($cellData).to.eq("Michael Lawson");
      });
      table.ReadTableRowColumnData(1, 3, "v2", 200).then(($cellData) => {
        expect($cellData).to.eq("Lindsay Ferguson");
      });
      table.ReadTableRowColumnData(2, 3, "v2", 200).then(($cellData) => {
        expect($cellData).to.eq("Byron Fields");
      });
      table.ReadTableRowColumnData(3, 3, "v2", 200).then(($cellData) => {
        expect($cellData).to.eq("Ryan Holmes");
      });

      //Changing OR to AND
      agHelper.GetNClick(table._filterOperatorDropdown);
      cy.get(table._dropdownText).contains("AND").click();
      agHelper.ClickButton("APPLY");
      table.ReadTableRowColumnData(0, 3, "v2").then(($cellData) => {
        expect($cellData).to.eq("Byron Fields");
      });
      table.ReadTableRowColumnData(1, 3, "v2", 200).then(($cellData) => {
        expect($cellData).to.eq("Ryan Holmes");
      });

      //Changing AND to OR
      agHelper.GetNClick(table._filterOperatorDropdown);
      cy.get(table._dropdownText).contains("OR").click();
      agHelper.GetNClick(table._filterConditionDropdown, 1);
      cy.get(table._dropdownText).contains("starts with").click();
      agHelper
        .GetNClick(table._filterInputValue, 1)
        .clear()
        .type("9")
        .wait(500);
      agHelper.ClickButton("APPLY");
      table.ReadTableRowColumnData(0, 3, "v2").then(($cellData) => {
        expect($cellData).to.eq("Lindsay Ferguson");
      });
      table.ReadTableRowColumnData(1, 3, "v2", 200).then(($cellData) => {
        expect($cellData).to.eq("Byron Fields");
      });
      table.ReadTableRowColumnData(2, 3, "v2", 200).then(($cellData) => {
        expect($cellData).to.eq("Ryan Holmes");
      });
      table.RemoveFilterNVerify("2381224", true, false, 0, "v2");
    });

    it("8. Verify Table Filter for changing from AND -> OR [Remove a filter] -> AND + Bug 12642", function () {
      table.OpenNFilterTable("id", "contains", "7");
      table.ReadTableRowColumnData(1, 4, "v2").then(($cellData) => {
        expect($cellData).to.eq("Beef steak");
      });
      table.OpenNFilterTable("productName", "contains", "I", "AND", 1);
      table.ReadTableRowColumnData(1, 4, "v2").then(($cellData) => {
        expect($cellData).to.eq("Avocado Panini");
      });
      table.OpenNFilterTable("userName", "starts with", "r", "AND", 2);
      table.ReadTableRowColumnData(0, 4, "v2").then(($cellData) => {
        expect($cellData).to.eq("Avocado Panini");
      });

      agHelper.GetNClick(table._filterOperatorDropdown);
      cy.get(table._dropdownText).contains("OR").click();
      agHelper.ClickButton("APPLY");

      table.ReadTableRowColumnData(1, 4, "v2").then(($cellData) => {
        expect($cellData).to.eq("Tuna Salad");
      });

      table.RemoveFilterNVerify("2381224", false, true, 0, "v2"); //Verifies bug 12642

      agHelper.GetNClick(table._filterOperatorDropdown);
      cy.get(table._dropdownText).contains("AND").click();
      agHelper.ClickButton("APPLY");

      table.ReadTableRowColumnData(0, 4, "v2").then(($cellData) => {
        expect($cellData).to.eq("Avocado Panini");
      });
      table.RemoveFilterNVerify("2381224", true, false, 0, "v2");
    });
  },
);
