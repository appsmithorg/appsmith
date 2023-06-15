import {
  agHelper,
  draggableWidgets,
  entityExplorer,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";

describe("FilePicker Widget Functionality", function () {
  before(() => {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.FILEPICKER);
  });

  it("Should test allowed values", () => {
    entityExplorer.SelectEntityByName("FilePicker1");
    propPane.EnterJSContext("Allowed file types", `[".csv"]`);
    agHelper.AssertElementAbsence(
      ".t--property-control-allowedfiletypes .t--codemirror-has-error",
    );
    propPane.EnterJSContext("Allowed file types", `.csv`);
    agHelper.AssertElementVisible(
      ".t--property-control-allowedfiletypes .t--codemirror-has-error",
    );
    propPane.EnterJSContext("Allowed file types", `[".csv", ".doc"]`);
    agHelper.AssertElementAbsence(
      ".t--property-control-allowedfiletypes .t--codemirror-has-error",
    );
  });
});
