import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Widget property navigation", () => {
  it("Collapsed field navigation", () => {
    _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.AUDIO, 100, 200);
    _.propPane.EnterJSContext("animateloading", "{{test}}", true, false);
    _.debuggerHelper.AssertErrorCount(1);
    _.propPane.ToggleSection("general");
    _.propPane.AssertIfPropertyIsNotVisible("animateloading");
    _.debuggerHelper.ClickDebuggerIcon();
    _.debuggerHelper.ClicklogEntityLink();
    _.propPane.AssertIfPropertyIsVisible("animateloading");

    _.propPane.DeleteWidgetFromPropertyPane("Audio1");
  });
});
