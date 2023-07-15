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
    _.debuggerHelper.CloseBottomBar();
  });
  it("Navigation to a nested panel", () => {
    _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.TAB, 100, 200);
    _.propPane.OpenTableColumnSettings("tab2");
    _.propPane.EnterJSContext("visible", "{{test}}", true, false);
    _.debuggerHelper.AssertErrorCount(1);
    _.propPane.NavigateBackToPropertyPane();
    _.debuggerHelper.ClickDebuggerIcon();
    _.debuggerHelper.ClicklogEntityLink();
    _.agHelper.GetElement(_.propPane._paneTitle).contains("Tab 2");
    _.propPane.AssertIfPropertyIsVisible("visible");

    _.debuggerHelper.CloseBottomBar();
    _.entityExplorer.SelectEntityByName("Tabs1");
    _.entityExplorer.DeleteWidgetFromEntityExplorer("Tabs1");
  });
});
