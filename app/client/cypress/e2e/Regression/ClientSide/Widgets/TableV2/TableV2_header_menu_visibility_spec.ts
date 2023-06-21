import {
  entityExplorer,
  propPane,
  agHelper,
  draggableWidgets,
  deployMode,
} from "../../../../../support/Objects/ObjectsCore";
import { TABLE_DATA_STATIC } from "../../../../../support/Constants";

describe("Table widget v2", function () {
  it("1. should test that header menu should be hidden when sorting and freezing is disabled", function () {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.TABLE, 500, 300);
    propPane.ToggleJSMode("Table data");
    propPane.UpdatePropertyFieldValue("Table data", TABLE_DATA_STATIC);
    propPane.TogglePropertyState("Column sorting", "Off");
    propPane.TogglePropertyState("Allow column freeze", "Off");

    agHelper.GetElement(".hide-menu").should("exist");

    deployMode.DeployApp();

    agHelper.GetElement(".hide-menu").should("exist");
  });
});
