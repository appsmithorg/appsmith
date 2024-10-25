import { demoTableDataForSelect } from "../../../../../fixtures/Table/DemoTableData";
import { featureFlagIntercept } from "../../../../../support/Objects/FeatureFlags";
import {
  entityExplorer,
  propPane,
  deployMode,
  table,
  assertHelper,
  locators,
  draggableWidgets,
  agHelper,
} from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

describe(
  "Verify various Table_Filter combinations",
  { tags: ["@tag.Widget", "@tag.Table", "@tag.Binding"] },
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
      cy.get("body").type("{esc}");
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

    it("11. Verify table search includes label and value for table with select column type", () => {
      deployMode.NavigateBacktoEditor();
      // This flag is turned on to allow the label show in the table select cell content
      // when this feature is turned on fully, this flag will be removed
      featureFlagIntercept({ release_table_cell_label_value_enabled: true });
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      propPane.EnterJSContext("Table data", demoTableDataForSelect);

      // Edit role column to select type
      table.ChangeColumnType("role", "Select", "v2");
      table.EditColumn("role", "v2");
      agHelper.UpdateCodeInput(
        locators._controlOption,
        `
         {{
           [
             {"label": "Software Engineer",
             "value": 10,},
             {"label": "Product Manager",
             "value": 20,},
             {"label": "UX Designer",
             "value": 30,}
           ]
         }}
       `,
      );
      // Search for a label in the table
      table.SearchTable("Software Engineer");
      table.ReadTableRowColumnData(0, 2, "v2").then((afterSearch) => {
        expect(afterSearch).to.eq("Software Engineer");
      });
      table.RemoveSearchTextNVerify("1", "v2");
    });

    it("12. Verify table filter for select column type", function () {
      featureFlagIntercept({ release_table_cell_label_value_enabled: true });
      table.OpenNFilterTable("role", "is exactly", "Product Manager");
      table.ReadTableRowColumnData(0, 2, "v2").then(($cellData) => {
        expect($cellData).to.eq("Product Manager");
      });
      table.ReadTableRowColumnData(1, 2, "v2").then(($cellData) => {
        expect($cellData).to.eq("Product Manager");
      });
    });
  },
);
