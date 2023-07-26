import * as _ from "../../../../support/Objects/ObjectsCore";
import { EntityItems } from "../../../../support/Pages/AssertHelper";

describe("JSObjects", () => {
  it("Switch to settings pane when clicked on update logs", () => {
    _.jsEditor.NavigateToNewJSEditor();
    _.jsEditor.EnableDisableAsyncFuncSettings("myFun2");
    _.agHelper.GetNClick(_.jsEditor._codeTab);
    _.entityExplorer.NavigateToSwitcher("Widgets");
    _.debuggerHelper.ClickDebuggerIcon();
    _.debuggerHelper.ClickLogsTab();
    _.debuggerHelper.ClicklogEntityLink(true);

    _.agHelper.AssertElementVisible(_.jsEditor._asyncJSFunctionSettings);
    _.entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "JSObject1",
      entityType: EntityItems.JSObject,
    });
  });
});
