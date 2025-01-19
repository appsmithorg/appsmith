import {
  entityExplorer,
  propPane,
  agHelper,
  draggableWidgets,
  deployMode,
  table,
} from "../../../../../support/Objects/ObjectsCore";
import { TABLE_DATA_STATIC } from "../../../../../support/Constants";

describe(
  "Table widget v2",
  { tags: ["@tag.All", "@tag.Table", "@tag.Binding"] },
  function () {
    it("1. Bug id #24005: should test that header menu should be hidden when sorting and freezing is disabled", function () {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TABLE, 500, 300);
      propPane.EnterJSContext("Table data", TABLE_DATA_STATIC);
      propPane.TogglePropertyState("Column sorting", "Off");
      propPane.TogglePropertyState("Allow column freeze", "Off");
      agHelper.AssertElementExist(table._hideMenu);

      deployMode.DeployApp();

      agHelper.AssertElementExist(table._hideMenu);
    });
  },
);
