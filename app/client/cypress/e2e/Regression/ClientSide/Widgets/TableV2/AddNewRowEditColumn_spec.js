import * as _ from "../../../../../support/Objects/ObjectsCore";

const tableData = `[
    {
      "step": "#1",
      "task": "Drop a table",
      "completed": true,
      "Date": "2021-05-25 12:00"
    },
    {
      "step": "#2",
      "task": "Create a query fetch_users with the Mock DB",
      "completed": true,
      "Date": "2021-05-27 14:30"
    },
    {
      "step": "#3",
      "task": "Bind the query using => fetch_users.data",
      "completed": false,
      "Date": "2021-05-29 16:45"
    }
  ]`;

describe(
  "Table Widget V2 - Add New Row and Edit Date Column",
  { tags: ["@tag.Widget", "@tag.Table"] },
  () => {
    before(() => {
      _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.TABLE);
      _.propPane.EnterJSContext("Table data", tableData);
    });

    it("1. Verify Date column is visible and editable", () => {
      _.propPane.TogglePropertyState("Allow adding a row", "On");
      cy.get(".t--add-new-row").should("exist");
      // enabling the ediatable option for the three columns
      cy.makeColumnEditable("step");
      cy.makeColumnEditable("task");
      cy.makeColumnEditable("Date");
      cy.get(".t--add-new-row").click();
      cy.get(".tableWrap .new-row").should("exist");

      // entering the values in the table
      cy.enterTableCellValue(0, 0, "22");
      cy.enterTableCellValue(1, 0, "21");
      cy.enterTableCellValue(3, 0);
      cy.get(
        '[aria-label="Wed May 15 2024"] > .bp3-datepicker-day-wrapper',
      ).click();

      // adding the text widget to the screen and updating its value as the table's date column field
      cy.dragAndDropToCanvas("textwidget", { x: 300, y: 600 });
      cy.openPropertyPane("textwidget");
      cy.updateCodeInput(".t--property-control-text", "{{Table1.newRow.Date}}");

      // Ensure the expected value matches the actual value format
      cy.get(".t--widget-textwidget .bp3-ui-text").should(
        "contain",
        "2024-05-15T00:00:00+05:30",
      );
    });
  },
);
