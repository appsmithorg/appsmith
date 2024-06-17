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

      // Click on the date input to open the date picker
      cy.enterTableCellValue(3, 0);
      const now = new Date();

      cy.get(".DayPicker-Day--today > .bp3-datepicker-day-wrapper").click();
      cy.dragAndDropToCanvas("textwidget", { x: 300, y: 600 });
      cy.openPropertyPane("textwidget");
      cy.updateCodeInput(".t--property-control-text", "{{Table1.newRow.Date}}");

      // checking the date selected and the date in the text widget matches correctly
      now.setHours(0, 0, 0, 0); // Reset time to 00:00:00
      const offset = now.getTimezoneOffset() * 60000; // offset in milliseconds
      const localISOTime = `${new Date(now.getTime() - offset).toISOString().slice(0, 19)}+05:30`; // adjust to the desired timezone// adjust to the desired timezone
      cy.get(".t--widget-textwidget .bp3-ui-text").should(
        "contain",
        `${localISOTime.split("T")[0]}T00:00:00+05:30`,
      );
    });
  },
);
