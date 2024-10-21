import * as _ from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

describe(
  "Divider Widget Functionality",
  { tags: ["@tag.Widget", "@tag.Divider", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("DividerDsl");
    });

    it("1. Add new Divider", () => {
      _.entityExplorer.DragDropWidgetNVerify(
        _.draggableWidgets.DIVIDER,
        320,
        200,
      );
      //Open Existing Divider from created  list
      EditorNavigation.SelectEntityByName("Divider1", EntityType.Widget);
      EditorNavigation.SelectEntityByName("Divider2", EntityType.Widget);
    });
  },
);
