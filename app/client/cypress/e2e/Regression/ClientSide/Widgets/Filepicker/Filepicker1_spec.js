import {
  agHelper,
  draggableWidgets,
  entityExplorer,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

describe(
  "FilePicker Widget Functionality",
  { tags: ["@tag.All", "@tag.Filepicker", "@tag.Binding"] },
  function () {
    before(() => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.FILEPICKER);
    });

    it("Should test allowed values", () => {
      EditorNavigation.SelectEntityByName("FilePicker1", EntityType.Widget);
      propPane.EnterJSContext("Allowed file types", `[".csv"]`);
      agHelper.AssertElementAbsence(
        ".t--property-control-allowedfiletypes .t--codemirror-has-error",
      );
      propPane.EnterJSContext("Allowed file types", `.csv`);
      agHelper.AssertElementVisibility(
        ".t--property-control-allowedfiletypes .t--codemirror-has-error",
      );
      propPane.EnterJSContext("Allowed file types", `[".csv", ".doc"]`);
      agHelper.AssertElementAbsence(
        ".t--property-control-allowedfiletypes .t--codemirror-has-error",
      );
    });
  },
);
