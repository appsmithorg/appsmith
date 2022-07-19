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

  it("1. Doesn't show lint warnings in debugger", () => {
    const JS_OBJECT_WITH_LINT_WARNING = `export default {
          myVar1: [],
          myVar2: {},
          myFun1: () => {
              //write code here
              const name = "Favour"
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
    agHelper.GetNClick(locator._errorTab);
    cy.contains("'name' is defined but never used.").should("not.exist");
    agHelper.RefreshPage();
    agHelper.GetNClick(locator._errorTab);
    cy.contains("'name' is defined but never used.").should("not.exist");
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
    }
}}`,
      true,
      true,
    );
    agHelper.AssertElementExist(locator._lintErrorElement);
    cy.get(locator._lintErrorElement)
      .first()
      .trigger("mouseover");
    cy.contains("'await' is not defined").should("not.exist");
    cy.contains(
      "'await' expressions are only allowed within async functions. Did you mean to mark this function as 'async'?",
    ).should("exist");
    propPane.UpdatePropertyFieldValue("onClick", "");

    // Test in JS Object
    jsEditor.CreateJSObject(JS_OBJECT_WITH_WRONG_AWAIT_KEYWORD, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });
    agHelper.AssertElementExist(locator._lintErrorElement);
    cy.get(locator._lintErrorElement)
      .first()
      .trigger("mouseover");
    cy.contains("'await' is not defined").should("not.exist");
    cy.contains(
      "'await' expressions are only allowed within async functions. Did you mean to mark this function as 'async'?",
    ).should("exist");

    // Test in Api
    apiPage.CreateApi();
    apiPage.EnterParams(
      "test",
      `{{function(){
        await Promise.all([])
    }()}}`,
    );
    agHelper.AssertElementExist(locator._lintErrorElement);
    cy.get(locator._lintErrorElement)
      .first()
      .trigger("mouseover");
    cy.contains("'await' is not defined").should("not.exist");
    cy.contains(
      "'await' expressions are only allowed within async functions. Did you mean to mark this function as 'async'?",
    ).should("exist");
  });

  it("3. TC. 1940 - Shows correct error when no comma is used to separate object properties", () => {
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
      true,
      true,
    );
    cy.get(locator._lintErrorElement)
      .contains("myFun1")
      .should("exist")
      .first()
      .trigger("mouseover");
    cy.contains(
      "Expected '}' to match '{' from line 1 and instead saw 'myFun1'",
    );
    // Test in JS Object
    jsEditor.CreateJSObject(JS_OBJECT_WITHOUT_COMMA_SEPARATOR, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });

    cy.get(locator._lintErrorElement)
      .contains("myFun1")
      .should("exist")
      .first()
      .trigger("mouseover");
    cy.contains(
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
    cy.get(locator._lintErrorElement)
      .contains("myFun1")
      .should("exist")
      .first()
      .trigger("mouseover");
    cy.contains(
      "Expected '}' to match '{' from line 1 and instead saw 'myFun1'",
    );
  });

  it("4. TC. 1938 - Shows correct lint error when currentItem/currentRow is used in field", () => {
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
    cy.get(locator._lintErrorElement).should("have.length", 2);
    ee.SelectEntityByName("Table1", "WIDGETS");
    agHelper.GetNClick(table._columnSettings("step"));
    cy.get(locator._lintErrorElement).should("not.exist");
    propPane.UpdatePropertyFieldValue("Computed Value", "{{currentRow}}");
    cy.get(locator._lintErrorElement).should("not.exist");

    // Test in JSObject
    jsEditor.CreateJSObject(JSOBJECT_WITH_INVALID_IDENTIFIER, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });
    cy.get(locator._lintErrorElement).should("have.length", 2);

    // test in Api
    apiPage.CreateApi();
    apiPage.EnterParams(
      "test",
      `{{function(){
        currentItem
        currentRow
    }()}}`,
    );
    cy.get(locator._lintErrorElement).should("have.length", 2);
  });

  it("5. Doesn't show error for 'unneccessary semi-colon'", () => {
    const JSOBJECT_WITH_UNNECCESARY_SEMICOLON = `export default {
        myFun1: () => {
            //write code here
            if (a) {
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
            if (a) {
                return true;
            };
        };
        }}`,
    );
    cy.get(locator._lintErrorElement).should("not.exist");

    // Test in JS Object
    ee.SelectEntityByName("JSObject1", "QUERIES/JS");
    jsEditor.EditJSObj(JSOBJECT_WITH_UNNECCESARY_SEMICOLON);
    cy.get(locator._lintErrorElement).should("not.exist");

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
    cy.get(locator._lintErrorElement).should("not.exist");
  });
});
