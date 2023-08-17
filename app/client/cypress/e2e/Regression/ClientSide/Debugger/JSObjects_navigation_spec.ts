import {
  jsEditor,
  agHelper,
  entityExplorer,
  debuggerHelper,
  entityItems,
} from "../../../../support/Objects/ObjectsCore";

describe("excludeForAirgap", "JSObjects", () => {
  it("1. Switch to settings pane when clicked on update logs", () => {
    jsEditor.NavigateToNewJSEditor();
    jsEditor.EnableDisableAsyncFuncSettings("myFun2");
    agHelper.GetNClick(jsEditor._codeTab);
    entityExplorer.NavigateToSwitcher("Widgets");
    debuggerHelper.ClickDebuggerIcon();
    debuggerHelper.ClickLogsTab();
    debuggerHelper.ClicklogEntityLink(true);

    agHelper.AssertElementVisibility(jsEditor._asyncJSFunctionSettings);
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "JSObject1",
      entityType: entityItems.JSObject,
    });
  });
  it("2. Focus and position cursor on the ch,line having an error", () => {
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
    jsEditor.CreateJSObject(JS_OBJECT_BODY, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });

    debuggerHelper.ClickDebuggerIcon();
    debuggerHelper.ClicklogEntityLink();
    agHelper.AssertCursorInput(".js-editor", { ch: 20, line: 6 });

    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "JSObject1",
      entityType: entityItems.JSObject,
    });
  });
});
