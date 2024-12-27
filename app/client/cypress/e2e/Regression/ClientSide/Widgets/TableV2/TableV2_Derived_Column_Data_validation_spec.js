/* eslint-disable cypress/no-unnecessary-waiting */
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

const commonlocators = require("../../../../../locators/commonlocators.json");
import {
  agHelper,
  apiPage,
  entityExplorer,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";

describe(
  "Test Create Api and Bind to Table widget",
  { tags: ["@tag.Widget", "@tag.Table", "@tag.Binding"] },
  function () {
    before(() => {
      agHelper.AddDsl("tableV2TextPaginationDsl");
    });

    it("1. Create an API and Execute the API and bind with Table V2", function () {
      // Create and execute an API and bind with table
      apiPage.CreateAndFillApi(
        this.dataSet.paginationUrl + this.dataSet.paginationParam,
      );
      agHelper.VerifyEvaluatedValue(
        this.dataSet.paginationUrl + "mock-api?records=20&page=1&size=10",
      );
      apiPage.RunAPI();
      //Validate Table V2 with API data and then add a column
      // Open property pane
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("Table data", "{{Api1.data}}");
      // Check Widget properties
      cy.CheckWidgetProperties(commonlocators.serverSidePaginationCheckbox);
      // Open Text1 in propert pane
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("Text", "{{Table1.selectedRow.url}}");
      // Open Table1 propert pane
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      // Compare table 1st index data with itself
      cy.readTableV2data("0", "0").then((tabData) => {
        const tableData = tabData;
        localStorage.setItem("tableDataPage1", tableData);
      });
      // Verify 1st index data
      cy.readTableV2data("0", "4").then((tabData) => {
        const tableData = tabData;
        expect(tableData).to.equal("1");
      });
      // add new column
      cy.addColumnV2("CustomColumn");
    });

    it("2. Table widget toggle test for background color", function () {
      // Open id property pane
      cy.editColumn("id");
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(1000);
      cy.moveToStyleTab();
      // Click on cell background JS button
      propPane.EnterJSContext("Cell Background", "Green");
      // Go back to table property pane
      cy.get("[data-testid='t--property-pane-back-btn']").click({
        force: true,
      });
      cy.wait("@updateLayout");
      // verify the cell background color
      cy.readTableV2dataValidateCSS(
        "1",
        "4",
        "background-color",
        "rgb(0, 128, 0)",
      );
    });

    it("3. Edit column name and validate test for computed value based on column type selected", function () {
      // opoen customColumn1 property pane
      cy.editColumn("customColumn1");
      cy.moveToContentTab();
      // Enter Apil 1st user email data into customColumn1
      cy.readTableV2dataPublish("1", "7").then((tabData) => {
        const tabValue = tabData;
        cy.updateComputedValueV2("{{Api1.data[0].email}}");
        cy.readTableV2dataPublish("1", "7").then((tabData) => {
          expect(tabData).not.to.be.equal(tabValue);
          cy.log("computed value of plain text " + tabData);
        });
      });
      cy.closePropertyPane();
    });

    it("4. Update table json data and check the column names updated", function () {
      // Open table propert pane
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      cy.backFromPropertyPanel();
      // Change the table data
      cy.testJsontext(
        "tabledata",
        JSON.stringify(this.dataSet.TableInputUpdate),
      );
      cy.wait("@updateLayout");
      // verify columns are visible or not in the propert pane
      cy.tableV2ColumnDataValidation("id");
      cy.tableV2ColumnDataValidation("email");
      cy.tableV2ColumnDataValidation("userName");
      cy.tableV2ColumnDataValidation("productName");
      cy.tableV2ColumnDataValidation("orderAmount");
      cy.tableV2ColumnDataValidation("customColumn1");
      // Hide the columns in property pane
      cy.hideColumn("email");
      cy.hideColumn("userName");
      cy.hideColumn("productName");
      cy.hideColumn("orderAmount");
      // verify customColumn is visible in the table
      cy.get(".draggable-header:contains('CustomColumn')").should("be.visible");
      cy.closePropertyPane();
    });

    it("5. Verify computed value with try-catch blocks handles missing nested properties", function () {
      cy.openPropertyPane("tablewidgetv2");

      // Set table data with nested object and missing property
      propPane.UpdatePropertyFieldValue(
        "Table data",
        `{{[{"name": "Rahul", age: {value: 31}}, {"name": "Jacq", age: {}}, {"name": "John"}]}`,
      );

      cy.editColumn("age");
      propPane.UpdatePropertyFieldValue(
        "Computed value",
        "{{currentRow.age.value}}",
      );

      cy.readTableV2data(0, 1).then((val) => {
        expect(val).to.equal("31");
      });

      cy.readTableV2data(1, 1).then((val) => {
        expect(val).to.equal("");
      });

      cy.readTableV2data(2, 1).then((val) => {
        expect(val).to.equal("");
      });

      // Clean up
      cy.backFromPropertyPanel();
    });
  },
);
