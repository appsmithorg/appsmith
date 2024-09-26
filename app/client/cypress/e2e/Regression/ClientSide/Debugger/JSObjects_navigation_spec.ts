import {
  jsEditor,
  agHelper,
  entityExplorer,
  debuggerHelper,
  entityItems,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation from "../../../../support/Pages/EditorNavigation";

describe("JSObjects", { tags: ["@tag.JS"] }, () => {
  it("1. Focus and position cursor on the ch,line having an error", () => {
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

    debuggerHelper.OpenDebugger();
    debuggerHelper.ClicklogEntityLink();
    agHelper.AssertCursorInput(".js-editor", { ch: 20, line: 6 });

    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "JSObject1",
      entityType: entityItems.JSObject,
    });
  });

  it("2. Bug 24990 Clears logs filter using backspace", function () {
    const JS_OBJECT_BODY = `export default {
      myVar1: [],
      myVar2: {},
      myFun1 () {
          //	write code here
          return [1,2,3]
      },
      async myFun2 () {
          return []
      }
  }`;
    jsEditor.CreateJSObject(JS_OBJECT_BODY, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });
    jsEditor.SelectFunctionDropdown("myFun1");
    jsEditor.RunJSObj();
    debuggerHelper.ClickLogsTab();
    agHelper.AssertText(
      debuggerHelper.locators._debuggerFilter,
      "val",
      "JSObject1",
    );
    agHelper.TypeText(
      debuggerHelper.locators._debuggerFilter,
      "{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}",
      { delay: 50, parseSpecialCharSeq: true },
    );
    agHelper.AssertText(debuggerHelper.locators._debuggerFilter, "val", "");
    debuggerHelper.DebuggerLogsFilter("JSObject1");
    debuggerHelper.DebuggerLogsFilter("{backspace}");
    agHelper.AssertText(debuggerHelper.locators._debuggerFilter, "val", "");
    debuggerHelper.DebuggerLogsFilter("JSObject1");
    agHelper.GetNClick(debuggerHelper.locators._debuggerFilterClear);
    agHelper.AssertText(debuggerHelper.locators._debuggerFilter, "val", "");
  });
});
