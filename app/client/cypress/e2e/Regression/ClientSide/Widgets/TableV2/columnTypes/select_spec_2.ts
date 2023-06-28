import {
  entityExplorer,
  propPane,
  agHelper,
  draggableWidgets,
  deployMode,
  table,
  locators,
} from "../../../../../../support/Objects/ObjectsCore";

const TABLE_DATA_1 = `[
      {
        "step": "#1",
        "task": "Drop a table",
        "status": "✅",
        "action": ""
      },
      {
        "step": "#2",
        "task": "Create a query fetch_users with the Mock DB",
        "status": "--",
        "action": ""
      },
      {
        "step": "#3",
        "task": "Bind the query using => fetch_users.data",
        "status": "--",
        "action": ""
      }
    ]`;

describe("Table widget v2: select column type test", function () {
  before(() => {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.TABLE, 300, 100);
    propPane.EnterJSContext("Table data", TABLE_DATA_1);
  });
  it("1. should test that select column dropdown has no results found string when select option is {{null}} ", function () {
    /**
     * Flow:
     * 1. Dnd table widget = DONE
     * 2. Bind data to it = DONE
     * 3. Convert step column to select type = DONE
     * 4. Pass options to it as {{null}}, {{[null, null]}}
     * 5. Check that in the table drop down you get No results found while editing and adding a row
     */
    propPane.TogglePropertyState("Allow adding a row", "On");

    table.ChangeColumnType("step", "Select", "v2");
    const colSettings = table._columnSettingsV2("step", "Edit");
    agHelper.GetNClick(colSettings);
    propPane.TogglePropertyState("Editable", "On");

    //4
    propPane.UpdatePropertyFieldValue("Options", "{{null}}");

    // 5 while adding a new row
    agHelper.GetNClick(table._addNewRow, 0, true);
    agHelper.GetNClick(table._tableRow(0, 0, "v2"));
    agHelper.GetNAssertContains(table._selectMenuItem, "No Results Found");

    // 5 while editing a new row
    agHelper.GetNClick(table._discardRow, 0, true);
    agHelper.GetNClick(
      table._tableRow(0, 0, "v2") + " " + table._editCellIconDiv,
      0,
      true,
    );
    agHelper.GetNAssertContains(table._selectMenuItem, "No Results Found");
  });

  it("2. should test that select column dropdown has no results found string when select option is {{null}} ", function () {
    /**
     * Flow:
     * 1. Dnd table widget = DONE
     * 2. Bind data to it = DONE
     * 3. Convert step column to select type = DONE
     * 4. Pass options to it as {{null}}, {{[null, null]}}
     * 5. Check that in the table drop down you get No results found while editing and adding a row
     */
    propPane.NavigateBackToPropertyPane();

    const colSettings = table._columnSettingsV2("step", "Edit");
    agHelper.GetNClick(colSettings);

    propPane.UpdatePropertyFieldValue("Options", "{{[null, null]}}");

    // 5 while adding a new row
    agHelper.GetNClick(table._addNewRow, 0, true);
    agHelper.GetNClick(table._tableRow(0, 0, "v2"));
    agHelper.GetNAssertContains(table._selectMenuItem, "No Results Found");

    // 5 while editing a new row
    agHelper.GetNClick(table._discardRow, 0, true);
    agHelper.GetNClick(
      table._tableRow(0, 0, "v2") + " " + table._editCellIconDiv,
      0,
      true,
    );
    agHelper.GetNAssertContains(table._selectMenuItem, "No Results Found");
  });
});
