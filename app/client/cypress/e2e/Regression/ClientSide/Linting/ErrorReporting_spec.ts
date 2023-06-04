import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Lint error reporting", () => {
  before(() => {
    _.entityExplorer.DragDropWidgetNVerify("tablewidgetv2", 300, 500);
    _.table.AddSampleTableData();
    _.entityExplorer.DragDropWidgetNVerify("buttonwidget", 300, 300);
    _.entityExplorer.NavigateToSwitcher("Explorer");
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

    _.jsEditor.CreateJSObject(JS_OBJECT_WITH_LINT_WARNING, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });
    MouseHoverNVerify("name", "'name' is defined but never used.", false);
    _.agHelper.PressEscape();
    _.agHelper.GetNClick(_.debuggerHelper.locators._debuggerIcon);
    _.agHelper.GetNClick(_.locators._errorTab);
    _.debuggerHelper.DebuggerListDoesnotContain(
      "'name' is defined but never used.",
    );

    _.agHelper.RefreshPage();
    _.agHelper.GetNClick(_.debuggerHelper.locators._debuggerIcon);
    _.agHelper.GetNClick(_.locators._errorTab);
    _.debuggerHelper.DebuggerListDoesnotContain(
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
    _.entityExplorer.ExpandCollapseEntity("Queries/JS");
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");
    _.propPane.EnterJSContext(
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
    _.agHelper.AssertContains("'await' is not defined", "not.exist");

    // Test in JS Object
    _.jsEditor.CreateJSObject(JS_OBJECT_WITH_WRONG_AWAIT_KEYWORD, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });
    MouseHoverNVerify(
      "await",
      "'await' expressions are only allowed within async functions. Did you mean to mark this function as 'async'?",
    );
    _.agHelper.AssertContains("'await' is not defined", "not.exist");

    // Test in Api
    _.apiPage.CreateApi();
    _.apiPage.EnterParams(
      "test",
      `{{function(){
        await Promise.all([])
    }()}}`,
    );
    MouseHoverNVerify(
      "await",
      "'await' expressions are only allowed within async functions. Did you mean to mark this function as 'async'?",
    );
    _.agHelper.AssertContains("'await' is not defined", "not.exist");
  });

  it("3. TC. 1940 - Shows correct error when no comma is used to separate object properties + Bug 8659", () => {
    const JS_OBJECT_WITHOUT_COMMA_SEPARATOR = `export default {
        myVar1: [],
        myVar2: {}
        myFun1: () => {
        }
    }`;

    // Test in PropertyPane
    _.entityExplorer.ExpandCollapseEntity("Queries/JS");
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");
    _.propPane.EnterJSContext(
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
    _.jsEditor.CreateJSObject(JS_OBJECT_WITHOUT_COMMA_SEPARATOR, {
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
    _.apiPage.CreateApi();
    _.apiPage.EnterParams(
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
    _.entityExplorer.ExpandCollapseEntity("Queries/JS");
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");
    _.propPane.EnterJSContext(
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
    _.jsEditor.CreateJSObject(JS_OBJECT_WITH_SEMICOLON_SEPARATOR, {
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
    _.apiPage.CreateApi();
    _.apiPage.EnterParams(
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
    _.entityExplorer.ExpandCollapseEntity("Queries/JS");
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");
    _.propPane.UpdatePropertyFieldValue("Tooltip", "{{currentItem}}");
    _.propPane.UpdatePropertyFieldValue("Label", "{{currentRow}}");
    _.propPane.UpdatePropertyFieldValue("onClick", "");

    _.agHelper.AssertElementLength(_.locators._lintErrorElement, 2);

    //Test in Table for no error when using {{currentRow}}
    _.entityExplorer.SelectEntityByName("Table1", "Widgets");
    _.agHelper.GetNClick(_.table._columnSettings("step"));
    _.agHelper.AssertElementAbsence(_.locators._lintErrorElement);

    _.propPane.UpdatePropertyFieldValue("Computed value", "{{currentRow}}");
    _.agHelper.AssertElementAbsence(_.locators._lintErrorElement);

    // Test in JSObject for lint error
    _.jsEditor.CreateJSObject(JSOBJECT_WITH_INVALID_IDENTIFIER, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });
    _.agHelper.AssertElementLength(_.locators._lintErrorElement, 2);

    // test in Api
    _.apiPage.CreateApi();
    _.apiPage.EnterParams(
      "test",
      `{{function(){
        currentItem
        currentRow
    }()}}`,
    );
    _.agHelper.AssertElementLength(_.locators._lintErrorElement, 2);
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
    _.entityExplorer.SelectEntityByName("Button1", "Queries/JS");
    _.propPane.UpdatePropertyFieldValue("Tooltip", "");
    _.propPane.UpdatePropertyFieldValue("Label", "");
    _.propPane.UpdatePropertyFieldValue(
      "onClick",
      `{{
        function example(a) {
            if (1) {
                return true;
            };
        };
        }}`,
    );
    _.agHelper.AssertElementAbsence(_.locators._lintErrorElement);

    // Test in JS Object
    _.entityExplorer.SelectEntityByName("JSObject1", "Queries/JS");
    _.jsEditor.EditJSObj(JSOBJECT_WITH_UNNECCESARY_SEMICOLON);
    _.agHelper.AssertElementAbsence(_.locators._lintErrorElement);

    // Test in API
    _.apiPage.CreateApi();
    _.apiPage.EnterParams(
      "test",
      `{{function(){
        if (1) {
            return true;
        };
    }()}}`,
    );
    _.agHelper.AssertElementAbsence(_.locators._lintErrorElement);
  });

  function MouseHoverNVerify(lintOn: string, debugMsg: string, isError = true) {
    _.agHelper.Sleep();
    const element = isError
      ? cy.get(_.locators._lintErrorElement)
      : cy.get(_.locators._lintWarningElement);
    element.contains(lintOn).should("exist").first().trigger("mouseover");
    _.agHelper.AssertContains(debugMsg);
  }

  after(() => {
    //deleting all test data
    _.entityExplorer.ActionContextMenuByEntityName(
      "Api1",
      "Delete",
      "Are you sure?",
    );
    _.entityExplorer.ActionContextMenuByEntityName(
      "Api2",
      "Delete",
      "Are you sure?",
    );
    _.entityExplorer.ActionContextMenuByEntityName(
      "Api3",
      "Delete",
      "Are you sure?",
    );
    _.entityExplorer.ActionContextMenuByEntityName(
      "Api4",
      "Delete",
      "Are you sure?",
    );
    _.entityExplorer.ActionContextMenuByEntityName(
      "Api5",
      "Delete",
      "Are you sure?",
    );
    _.entityExplorer.ActionContextMenuByEntityName(
      "JSObject1",
      "Delete",
      "Are you sure?",
    );
    _.entityExplorer.ActionContextMenuByEntityName(
      "JSObject2",
      "Delete",
      "Are you sure?",
    );
    _.entityExplorer.ActionContextMenuByEntityName(
      "JSObject3",
      "Delete",
      "Are you sure?",
    );
    _.entityExplorer.ActionContextMenuByEntityName(
      "JSObject4",
      "Delete",
      "Are you sure?",
    );
    _.entityExplorer.ActionContextMenuByEntityName(
      "JSObject5",
      "Delete",
      "Are you sure?",
    );
  });
});
