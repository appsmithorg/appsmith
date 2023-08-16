import * as _ from "../../../../support/Objects/ObjectsCore";
import { EntityItems } from "../../../../support/Pages/AssertHelper";

describe("excludeForAirgap", "JSObjects", () => {
  it("Switch to settings pane when clicked on update logs", () => {
    _.jsEditor.NavigateToNewJSEditor();
    _.jsEditor.EnableDisableAsyncFuncSettings("myFun2");
    _.agHelper.GetNClick(_.jsEditor._codeTab);
    _.entityExplorer.NavigateToSwitcher("Widgets");
    _.debuggerHelper.ClickDebuggerIcon();
    _.debuggerHelper.ClickLogsTab();
    _.debuggerHelper.ClicklogEntityLink(true);

    _.agHelper.AssertElementVisibility(_.jsEditor._asyncJSFunctionSettings);
    _.entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "JSObject1",
      entityType: EntityItems.JSObject,
    });
  });
  it("Focus and position cursor on the ch,line having an error", () => {
    const JS_OBJECT_BODY = `export default {
        myVar1: [],
        myVar2: {},
        myFun1 () {
            //	write code here
            //	this.myVar1 = [1,2,3]
            let testing  = test + "test";
        },
        async myFun2 () {
            return []
            //	use async-await or promises
            //	await storeValue('varName', 'hello world')
        }
    }`;
    _.jsEditor.CreateJSObject(JS_OBJECT_BODY, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });

    _.debuggerHelper.ClickDebuggerIcon();
    _.debuggerHelper.ClicklogEntityLink();
    _.agHelper.AssertCursorInput(".js-editor", { ch: 20, line: 6 });

    _.entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "JSObject1",
      entityType: EntityItems.JSObject,
    });
  });
});
