import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const jsEditor = ObjectsRegistry.JSEditor,
  locator = ObjectsRegistry.CommonLocators,
  ee = ObjectsRegistry.EntityExplorer,
  agHelper = ObjectsRegistry.AggregateHelper,
  apiPage = ObjectsRegistry.ApiPage,
  propPane = ObjectsRegistry.PropertyPane;

describe("Linting async JSFunctions bound to data fields", () => {
  before(() => {
    ee.DragDropWidgetNVerify("buttonwidget", 300, 300);
    ee.NavigateToSwitcher("explorer");
  });

  it("1. Doesn't show lint warnings in debugger but shows on Hover only", () => {
    apiPage.CreateApi();
    const JS_OBJECT_CONTENT = `export default {
          myFun1: () => {
              //write code here
              Api1.run()
          },
          myFun2: async () => {
              //use async-await or promises
          }
      }`;

    jsEditor.CreateJSObject(JS_OBJECT_CONTENT, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });
    ee.SelectEntityByName("Button1", "Widgets");
    propPane.UpdatePropertyFieldValue("Label", "{{JSObject1.myFun2()}}");
    cy.get(locator._evaluateMsg).should("be.visible");
    cy.contains("View Source").click(); // should route to jsobject page
    cy.get(locator._lintWarningElement).should("have.length", 1);
    MouseHoverNVerify(
      "myFun2",
      `Cannot bind async functions to data fields. Convert this to a sync function or remove references to "JSObject1.myFun2" on the following data field: Button1.text`,
      false,
    );
    // remove async tag from function
    jsEditor.EditJSObj(`export default {
        myFun1: () => {
            //write code here
            Api1.run()
        },
        myFun2: () => {
            //use async-await or promises
        }
    }`);

    cy.get(locator._lintWarningElement).should("not.exist");

    // Add async tag from function
    jsEditor.EditJSObj(`export default {
        myFun1: () => {
            //write code here
            Api1.run()
        },
        myFun2: async () => {
            //use async-await or promises
        }
    }`);

    cy.get(locator._lintWarningElement).should("have.length", 1);
    MouseHoverNVerify(
      "myFun2",
      `Cannot bind async functions to data fields. Convert this to a sync function or remove references to "JSObject1.myFun2" on the following data field: Button1.text`,
      false,
    );

    ee.SelectEntityByName("Button1", "Widgets");
    propPane.UpdatePropertyFieldValue("Label", "{{JSObject1.myFun1()}}");
    cy.get(locator._evaluateMsg).should("be.visible");
    cy.contains("View Source").click(); // should route to jsobject page
    cy.get(locator._lintWarningElement).should("have.length", 2);
    MouseHoverNVerify(
      "myFun1",
      `Functions bound to data fields cannot execute async code. Remove async statements highlighted below or remove references to "JSObject1.myFun1" on the following data field: Button1.text`,
      false,
    );
    MouseHoverNVerify(
      "run",
      `Cannot execute async code on functions bound to data fields`,
      false,
    );
    jsEditor.EditJSObj(`export default {
        myFun1: () => {
            //write code here
            Api1.run()
        },
        myFun2: async () => {
            //use async-await or promises
        }
    }`);
    // Remove binding from label, and add to onClick. Expect no error
    ee.SelectEntityByName("Button1", "Widgets");
    propPane.UpdatePropertyFieldValue("Label", "Click here");
    propPane.EnterJSContext(
      "onClick",
      `{{
          () => {
          JSObject1.myFun1();
          JSObject1.myFun2()
      }}}`,
    );
    ee.ExpandCollapseEntity("Queries/JS");
    ee.SelectEntityByName("JSObject1", "Queries/JS");
    cy.get(locator._lintWarningElement).should("not.exist");
  });

  function MouseHoverNVerify(lintOn: string, debugMsg: string, isError = true) {
    agHelper.Sleep();
    const element = isError
      ? cy.get(locator._lintErrorElement)
      : cy.get(locator._lintWarningElement);
    element.contains(lintOn).should("exist").first().trigger("mouseover");
    agHelper.AssertContains(debugMsg);
  }

  after(() => {
    //deleting all test data
    ee.ActionContextMenuByEntityName("Api1", "Delete", "Are you sure?");
    ee.ActionContextMenuByEntityName("JSObject1", "Delete", "Are you sure?");
  });
});
