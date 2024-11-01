import {
  agHelper,
  apiPage,
  debuggerHelper,
  entityExplorer,
  entityItems,
  jsEditor,
  locators,
  propPane,
  table,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
  PageLeftPane,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";

describe("Lint error reporting", { tags: ["@tag.JS", "@tag.Binding"] }, () => {
  before(() => {
    entityExplorer.DragDropWidgetNVerify("tablewidgetv2", 300, 500);
    table.AddSampleTableData();
    entityExplorer.DragDropWidgetNVerify("buttonwidget", 300, 300);
  });

  it("1. Doesn't show lint warnings in debugger but shows on Hover only", () => {
    const JS_OBJECT_WITH_LINT_WARNING = `export default {
          myVar1: [],
          myVar2: {},
          myFun1: () => {
              //write code here
              const name = "Automation"
          },
          myFun2: async () => {
              //use async-await or promises
          }
      }`;

    jsEditor.CreateJSObject(JS_OBJECT_WITH_LINT_WARNING, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });
    MouseHoverNVerify("name", "'name' is defined but never used.", false);
    agHelper.PressEscape();
    agHelper.GetNClick(debuggerHelper.locators._debuggerIcon);
    agHelper.GetNClick(locators._errorTab);
    debuggerHelper.DebuggerListDoesnotContain(
      "'name' is defined but never used.",
    );

    agHelper.RefreshPage();
    agHelper.GetNClick(debuggerHelper.locators._debuggerIcon);
    agHelper.GetNClick(locators._errorTab);
    debuggerHelper.DebuggerListDoesnotContain(
      "'name' is defined but never used.",
    );
  });

  it("2. TC. 1939 - Shows correct error when await keyword is used in sync functions", () => {
    const JS_OBJECT_WITH_WRONG_AWAIT_KEYWORD = `export default {
        myVar1: [],
        myVar2: {},
        myFun1: () => {
            //write code here
            await Promise.all([])
        }
    }`;

    // Test in PropertyPane
    EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
    propPane.EnterJSContext(
      "onClick",
      `{{
        () => {
        await showAlert('test')
    }}}`,
    );

    MouseHoverNVerify(
      "await",
      "'await' expressions are only allowed within async functions. Did you mean to mark this function as 'async'?",
    );
    agHelper.AssertContains("'await' is not defined", "not.exist");

    // Test in JS Object
    jsEditor.CreateJSObject(JS_OBJECT_WITH_WRONG_AWAIT_KEYWORD, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });
    MouseHoverNVerify(
      "await",
      "'await' expressions are only allowed within async functions. Did you mean to mark this function as 'async'?",
    );
    agHelper.AssertContains("'await' is not defined", "not.exist");

    // Test in Api
    apiPage.CreateApi();
    apiPage.EnterParams(
      "test",
      `{{function(){
        await Promise.all([])
    }()}}`,
    );
    MouseHoverNVerify(
      "await",
      "'await' expressions are only allowed within async functions. Did you mean to mark this function as 'async'?",
    );
    agHelper.AssertContains("'await' is not defined", "not.exist");
  });

  it("3. TC. 1940 - Shows correct error when no comma is used to separate object properties + Bug 8659", () => {
    const JS_OBJECT_WITHOUT_COMMA_SEPARATOR = `export default {
        myVar1: [],
        myVar2: {}
        myFun1: () => {
        }
    }`;

    // Test in PropertyPane
    EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
    propPane.EnterJSContext(
      "onClick",
      `{{ {
          myVar2: {}
          myFun1: () => {
          }
        }}}`,
    );
    MouseHoverNVerify(
      "myFun1",
      "Expected '}' to match '{' from line 1 and instead saw 'myFun1'",
    );

    // Test in JS Object
    jsEditor.CreateJSObject(JS_OBJECT_WITHOUT_COMMA_SEPARATOR, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });
    MouseHoverNVerify(
      "myFun1",
      "Expected '}' to match '{' from line 1 and instead saw 'myFun1'",
    );

    // Test in Api
    apiPage.CreateApi();
    apiPage.EnterParams(
      "test",
      `{{ {
        myVar2: {}
        myFun1: () => {
        }
      }}}`,
    );
    MouseHoverNVerify(
      "myFun1",
      "Expected '}' to match '{' from line 1 and instead saw 'myFun1'",
    );
  });

  it("4. TC. 1940 - Shows correct error when semicolon used instead of comma to separate object properties", () => {
    const JS_OBJECT_WITH_SEMICOLON_SEPARATOR = `export default {
      func1: () => {
        showAlert('this')
      };
      func2: () => {
      }
    }`;

    // Test in PropertyPane
    EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
    propPane.EnterJSContext(
      "onClick",
      `{{ {
          myVar2: {};
          myFun1: () => {
          }
        }}}`,
    );
    MouseHoverNVerify(
      ";",
      "Expected '}' to match '{' from line 1 and instead saw ';'",
    );

    // Test in JS Object
    jsEditor.CreateJSObject(JS_OBJECT_WITH_SEMICOLON_SEPARATOR, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });
    MouseHoverNVerify(
      ";",
      "Expected '}' to match '{' from line 1 and instead saw ';'",
    );

    // Test in Api
    apiPage.CreateApi();
    apiPage.EnterParams(
      "test",
      `{{ {
        myVar2: {};
        myFun1: () => {
        }
      }}}`,
    );
    MouseHoverNVerify(
      ";",
      "Expected '}' to match '{' from line 1 and instead saw ';'",
    );
  });

  it("5. TC. 1938 - Shows correct lint error when currentItem/currentRow is used in field + Bug 15099", () => {
    const JSOBJECT_WITH_INVALID_IDENTIFIER = `export default {
        myFun1: () => {
            //write code here
       console.log(currentItem, currentRow)
        },
        myFun2: async () => {
            //use async-await or promises
        }
    }
    `;
    // Test in PropertyPane
    EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
    propPane.UpdatePropertyFieldValue("onClick", "");
    propPane.UpdatePropertyFieldValue("Tooltip", "{{currentItem}}");
    propPane.UpdatePropertyFieldValue("Label", "{{currentRow}}");

    agHelper.AssertElementLength(locators._lintErrorElement, 2);

    //Test in Table for no error when using {{currentRow}}
    EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
    agHelper.GetNClick(table._columnSettings("step", "Edit"));
    agHelper.AssertElementAbsence(locators._lintErrorElement);

    propPane.UpdatePropertyFieldValue("Computed value", "{{currentRow}}");
    agHelper.AssertElementAbsence(locators._lintErrorElement);

    // Test in JSObject for lint error
    jsEditor.CreateJSObject(JSOBJECT_WITH_INVALID_IDENTIFIER, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
      prettify: false,
    });
    agHelper.AssertElementLength(locators._lintErrorElement, 2);

    // test in Api
    apiPage.CreateApi();
    apiPage.EnterParams(
      "test",
      `{{function(){
        currentItem
        currentRow
    }()}}`,
    );
    agHelper.AssertElementLength(locators._lintErrorElement, 2);
  });

  it("6. Bug 15156 - Doesn't show error for 'unneccessary semi-colon'", () => {
    const JSOBJECT_WITH_UNNECCESARY_SEMICOLON = `export default {
        myFun1: () => {
            //write code here
            if (1) {
                return true;
            };
        }
    }
    `;
    // Test in PropertyPane
    EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
    propPane.UpdatePropertyFieldValue("Tooltip", "");
    propPane.UpdatePropertyFieldValue("Label", "");
    propPane.UpdatePropertyFieldValue(
      "onClick",
      `{{
        function example(a) {
            if (1) {
                return true;
            };
        };
        }}`,
    );
    agHelper.AssertElementAbsence(locators._lintErrorElement);

    // Test in JS Object
    EditorNavigation.SelectEntityByName("JSObject1", EntityType.JSObject);
    jsEditor.EditJSObj(JSOBJECT_WITH_UNNECCESARY_SEMICOLON);
    agHelper.AssertElementAbsence(locators._lintErrorElement);

    // Test in API
    apiPage.CreateApi();
    apiPage.EnterParams(
      "test",
      `{{function(){
        if (1) {
            return true;
        };
    }()}}`,
    );
    agHelper.AssertElementAbsence(locators._lintErrorElement);
  });

  function MouseHoverNVerify(lintOn: string, debugMsg: string, isError = true) {
    agHelper.Sleep();
    const element = isError
      ? cy.get(locators._lintErrorElement)
      : cy.get(locators._lintWarningElement);
    element.contains(lintOn).should("exist").first().trigger("mouseover");
    agHelper.AssertContains(debugMsg);
  }

  after(() => {
    //deleting all test data
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "Api1",
      action: "Delete",
      entityType: entityItems.Api,
    });
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "Api2",
      action: "Delete",
      entityType: entityItems.Api,
    });
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "Api3",
      action: "Delete",
      entityType: entityItems.Api,
    });
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "Api4",
      action: "Delete",
      entityType: entityItems.Api,
    });
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "Api5",
      action: "Delete",
      entityType: entityItems.Api,
    });
    PageLeftPane.switchSegment(PagePaneSegment.JS);
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "JSObject1",
      action: "Delete",
      entityType: entityItems.JSObject,
    });
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "JSObject2",
      action: "Delete",
      entityType: entityItems.JSObject,
    });
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "JSObject3",
      action: "Delete",
      entityType: entityItems.JSObject,
    });
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "JSObject4",
      action: "Delete",
      entityType: entityItems.JSObject,
    });
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "JSObject5",
      action: "Delete",
      entityType: entityItems.JSObject,
    });
  });
});
