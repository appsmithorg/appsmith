import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const jsEditor = ObjectsRegistry.JSEditor,
  locator = ObjectsRegistry.CommonLocators,
  ee = ObjectsRegistry.EntityExplorer,
  agHelper = ObjectsRegistry.AggregateHelper,
  table = ObjectsRegistry.Table,
  apiPage = ObjectsRegistry.ApiPage,
  propPane = ObjectsRegistry.PropertyPane;

describe("Lint error reporting", () => {
  before(() => {
    ee.DragDropWidgetNVerify("tablewidgetv2", 300, 500);
    ee.DragDropWidgetNVerify("buttonwidget", 300, 300);
    ee.NavigateToSwitcher("explorer");
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
    agHelper.Escape();
    agHelper.GetNClick(locator._errorTab);
    agHelper.AssertContains("'name' is defined but never used.", "not.exist");

    agHelper.RefreshPage();
    agHelper.GetNClick(locator._errorTab);
    agHelper.AssertContains("'name' is defined but never used.", "not.exist");
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
    ee.ExpandCollapseEntity("QUERIES/JS");
    ee.SelectEntityByName("Button1", "WIDGETS");
    jsEditor.EnterJSContext(
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
    ee.ExpandCollapseEntity("QUERIES/JS");
    ee.SelectEntityByName("Button1", "WIDGETS");
    jsEditor.EnterJSContext(
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
    ee.ExpandCollapseEntity("QUERIES/JS");
    ee.SelectEntityByName("Button1", "WIDGETS");
    jsEditor.EnterJSContext(
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
    ee.ExpandCollapseEntity("QUERIES/JS");
    ee.SelectEntityByName("Button1", "WIDGETS");
    propPane.UpdatePropertyFieldValue("Tooltip", "{{currentItem}}");
    propPane.UpdatePropertyFieldValue("Label", "{{currentRow}}");
    propPane.UpdatePropertyFieldValue("onClick", "");

    agHelper.AssertElementLength(locator._lintErrorElement, 2);

    //Test in Table for no error when using {{currentRow}}
    ee.SelectEntityByName("Table1", "WIDGETS");
    agHelper.GetNClick(table._columnSettings("step"));
    agHelper.AssertElementAbsence(locator._lintErrorElement);

    propPane.UpdatePropertyFieldValue("Computed Value", "{{currentRow}}");
    agHelper.AssertElementAbsence(locator._lintErrorElement);

    // Test in JSObject for lint error
    jsEditor.CreateJSObject(JSOBJECT_WITH_INVALID_IDENTIFIER, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });
    agHelper.AssertElementLength(locator._lintErrorElement, 2);

    // test in Api
    apiPage.CreateApi();
    apiPage.EnterParams(
      "test",
      `{{function(){
        currentItem
        currentRow
    }()}}`,
    );
    agHelper.AssertElementLength(locator._lintErrorElement, 2);
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
    ee.SelectEntityByName("Button1", "QUERIES/JS");
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
    agHelper.AssertElementAbsence(locator._lintErrorElement);

    // Test in JS Object
    ee.SelectEntityByName("JSObject1", "QUERIES/JS");
    jsEditor.EditJSObj(JSOBJECT_WITH_UNNECCESARY_SEMICOLON);
    agHelper.AssertElementAbsence(locator._lintErrorElement);

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
    agHelper.AssertElementAbsence(locator._lintErrorElement);
  });

  function MouseHoverNVerify(lintOn: string, debugMsg: string, isError = true) {
    agHelper.Sleep();
    const element = isError
      ? cy.get(locator._lintErrorElement)
      : cy.get(locator._lintWarningElement);
    element
      .contains(lintOn)
      .should("exist")
      .first()
      .trigger("mouseover");
    agHelper.AssertContains(debugMsg);
  }

  after(() => {
    //deleting all test data
    ee.ActionContextMenuByEntityName("Api1", "Delete", "Are you sure?");
    ee.ActionContextMenuByEntityName("Api2", "Delete", "Are you sure?");
    ee.ActionContextMenuByEntityName("Api3", "Delete", "Are you sure?");
    ee.ActionContextMenuByEntityName("Api4", "Delete", "Are you sure?");
    ee.ActionContextMenuByEntityName("Api5", "Delete", "Are you sure?");
    ee.ActionContextMenuByEntityName("JSObject1", "Delete", "Are you sure?");
    ee.ActionContextMenuByEntityName("JSObject2", "Delete", "Are you sure?");
    ee.ActionContextMenuByEntityName("JSObject3", "Delete", "Are you sure?");
    ee.ActionContextMenuByEntityName("JSObject4", "Delete", "Are you sure?");
    ee.ActionContextMenuByEntityName("JSObject5", "Delete", "Are you sure?");
  });
});
