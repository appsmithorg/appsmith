import {
  entityExplorer,
  draggableWidgets,
  propPane,
  agHelper,
  table,
} from "../../../../../support/Objects/ObjectsCore";

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
const getCurrentDateISO = (): string => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 19) + "+05:30";
};

describe(
  "Table Widget V2 - Add New Row and Edit Date Column",
  { tags: ["@tag.Widget", "@tag.Table"] },
  () => {
    before(() => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TABLE);
      propPane.EnterJSContext("Table data", tableData);
    });

    const togglePropertyAndGoBack = (
      propertyName: string,
      toggle: "On" | "Off" = "On",
    ) => {
      propPane.TogglePropertyState(propertyName, toggle);
      propPane.NavigateBackToPropertyPane();
    };

    it("1. Verify Date column is visible and editable", () => {
      propPane.TogglePropertyState("Allow adding a row", "On");
      agHelper.AssertElementExist(table._addNewRow);
      // enabling the ediatable option for the three columns
      table.EditColumn("step", "v2");

      togglePropertyAndGoBack("Editable", "On");
      table.EditColumn("Date", "v2");

      togglePropertyAndGoBack("Editable", "On");
      table.AddNewRow();

      // entering the values in the table
      table.EditTableCell(0, 0, "22");

      // Click on the date input to open the date picker
      table.EditTableCell(0, 3, "");

      agHelper.GetNClick(`.DayPicker-Day--today > .bp3-datepicker-day-wrapper`);
      cy.dragAndDropToCanvas("textwidget", { x: 300, y: 600 });
      propPane.UpdatePropertyFieldValue("Text", `{{Table1.newRow.Date}}`);

      const localISOTime = getCurrentDateISO();
      cy.get(".t--widget-textwidget .bp3-ui-text").should(
        "contain",
        localISOTime.split("T")[0] + "T00:00:00+05:30",
      );
    });
  },
);
