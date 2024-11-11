import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

const commonlocators = require("../../../../../locators/commonlocators.json");

import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Test Create Api and Bind to Table widget V2",
  { tags: ["@tag.Widget", "@tag.Table", "@tag.Binding"] },
  () => {
    before("Create an API and Execute the API and bind with Table V", () => {
      _.agHelper.AddDsl("tableV2TextPaginationDsl");
    });

    it("1. Create an API and Execute the API and bind with Table", function () {
      cy.createAndFillApi(
        this.dataSet.paginationUrl,
        this.dataSet.paginationParam,
      );
      cy.RunAPI();
    });

    it("2. Validate Table with API data and then add a column", function () {
      // Open property pane
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      // Change the table data to Apil data users
      cy.testJsontext("tabledata", "{{Api1.data}}");
      // Check server sided pagination
      cy.CheckWidgetProperties(commonlocators.serverSidePaginationCheckbox);
      // Open property pane of Text1
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
      // Change the text value to selected url
      cy.testJsontext("text", "{{Table1.selectedRow.url}}");
      // Open property pane
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget); // Copmre the table 1st index with itself
      cy.readTableV2data("0", "0").then((tabData) => {
        const tableData = tabData;
        localStorage.setItem("tableDataPage1", tableData);
      });
      // Validate the table 1st index
      cy.readTableV2data("0", "4").then((tabData) => {
        const tableData = tabData;
        expect(tableData).to.equal("1");
      });
      // Add new column
      cy.addColumnV2("CustomColumn");
    });

    it("3. Update table json data and check the column names updated and validate empty value", function () {
      // Open property pane
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      // Change the table data
      cy.testJsontext(
        "tabledata",
        JSON.stringify(this.dataSet.TableInputWithNull),
      );
      cy.wait("@updateLayout");
      // Verify the columns are visible in property pane
      cy.tableV2ColumnDataValidation("id");
      cy.tableV2ColumnDataValidation("email");
      cy.tableV2ColumnDataValidation("userName");
      cy.tableV2ColumnDataValidation("productName");
      cy.tableV2ColumnDataValidation("orderAmount");
      cy.tableV2ColumnDataValidation("customColumn1");
      // Hide the columns in the table from property pane
      cy.hideColumn("id");
      cy.hideColumn("email");
      cy.hideColumn("userName");
      cy.hideColumn("productName");
      // Verify CustomColumn is visible
      cy.get(".draggable-header:contains('CustomColumn')")
        .scrollIntoView()
        .should("be.visible");
      // close property pane
      cy.closePropertyPane();
      // Validate the empty values
      cy.readTableV2dataPublish("0", "0").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("");
      });
    });

    it("4. Check Selected Row(s) Resets When Table data Changes", function () {
      // Select 1st row
      _.table.SelectTableRow(1, 0, true, "v2");
      cy.openPropertyPane("tablewidgetv2");
      // Empty first row
      cy.testJsontext("tabledata", "[]");
      cy.wait("@updateLayout");
      const newTableData = [...this.dataSet.TableInput];
      newTableData[0].userName = "";
      // Change table data from empty to some
      cy.testJsontext("tabledata", JSON.stringify(newTableData));
      cy.wait("@updateLayout");
      const selectedRowsSelector = `.t--widget-tablewidgetv2 .tbody .tr.selected-row`;
      // Verify selected row resets on table data changes
      cy.get(selectedRowsSelector).should(($p) => {
        // should found 0 rows
        expect($p).to.have.length(0);
      });
    });
  },
);
