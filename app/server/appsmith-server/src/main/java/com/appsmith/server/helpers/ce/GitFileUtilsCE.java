import { getCurrentDateISO } from "../../../../../support/DateHelper";
import * as _ from "../../../../../support/Objects/ObjectsCore";
import { table } from "../../../../../support/Objects/ObjectsCore";
const commonlocators = require("../../../../../locators/commonlocators.json");

// The spec tests the functionality of adding a new row to a table that includes a date field. 
// It verifies that when selecting a date, the correct date is displayed in a text widget.

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
    function togglePropertyAndGoBack(
      propertyName: string,
      toggle: "On" | "Off" = "On",
    ) {
      _.propPane.TogglePropertyState(propertyName, toggle);
      _.agHelper.GetNClick(commonlocators.editPropBackButton)
    }
    it("1. Verify Date column is visible and editable", () => {
      _.propPane.TogglePropertyState("Allow adding a row", "On");
      _.agHelper.AssertElementExist(table._addNewRow)
  
      _.table.EditColumn("step", "v2");

      togglePropertyAndGoBack("Editable", "On");
      _.table.EditColumn("Date","v2")
     
      togglePropertyAndGoBack("Editable", "On");
      _.agHelper.GetNClick(table._addNewRow)
      _.agHelper.AssertElementExist(".tableWrap .new-row")

      _.table.EditTableCell(0, 0, "22");

      _.table.EditTableCell(0, 3, "");

      _.agHelper.GetNClick(".DayPicker-Day--today")

      _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.TEXT, 300,600);
      _.propPane.UpdatePropertyFieldValue("Text", `{{Table1.newRow.Date}}`);

      const localISOTime = getCurrentDateISO();
      _.agHelper.GetNAssertContains(commonlocators.textWidgetName,localISOTime.split("T")[0] + "T00:00:00+05:30")
    });
  },
);
