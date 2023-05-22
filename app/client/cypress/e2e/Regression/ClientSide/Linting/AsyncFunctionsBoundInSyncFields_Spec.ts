import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Linting async JSFunctions bound to data fields", () => {
  before(() => {
    _.entityExplorer.DragDropWidgetNVerify("buttonwidget", 300, 300);
    _.entityExplorer.NavigateToSwitcher("Explorer");
  });

  it("1. Doesn't show lint warnings in debugger but shows on Hover only", () => {
    _.apiPage.CreateApi();
    const JS_OBJECT_CONTENT = `export default {
          myFun1: () => {
              //write code here
              Api1.run()
          },
          myFun2: async () => {
              //use async-await or promises
          }
      }`;

    _.jsEditor.CreateJSObject(JS_OBJECT_CONTENT, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");
    _.propPane.UpdatePropertyFieldValue("Label", "{{JSObject1.myFun2()}}");
    _.agHelper.AssertElementVisible(_.locators._evaluateMsg);
    _.agHelper.ContainsNClick("View source"); // should route to jsobject page

    _.agHelper.AssertElementLength(_.locators._lintWarningElement, 1);

    MouseHoverNVerify(
      "myFun2",
      `Cannot bind async functions to data fields. Convert this to a sync function or remove references to "JSObject1.myFun2" on the following data field: Button1.text`,
      false,
    );
    // remove async tag from function
    _.jsEditor.EditJSObj(`export default {
        myFun1: () => {
            //write code here
            Api1.run()
        },
        myFun2: () => {
            //use async-await or promises
        }
    }`);

    _.agHelper.AssertElementAbsence(_.locators._lintWarningElement);

    // Add async tag from function
    _.jsEditor.EditJSObj(`export default {
        myFun1: () => {
            //write code here
            Api1.run()
        },
        myFun2: async () => {
            //use async-await or promises
        }
    }`);

    _.agHelper.AssertElementLength(_.locators._lintWarningElement, 1);
    MouseHoverNVerify(
      "myFun2",
      `Cannot bind async functions to data fields. Convert this to a sync function or remove references to "JSObject1.myFun2" on the following data field: Button1.text`,
      false,
    );

    _.entityExplorer.SelectEntityByName("Button1", "Widgets");
    _.propPane.UpdatePropertyFieldValue("Label", "{{JSObject1.myFun1()}}");
    _.agHelper.AssertElementVisible(_.locators._evaluateMsg);
    _.agHelper.ContainsNClick("View source"); // should route to jsobject page
    _.agHelper.AssertElementLength(_.locators._lintWarningElement, 2);
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
    _.jsEditor.EditJSObj(`export default {
        myFun1: () => {
            //write code here
            Api1.run()
        },
        myFun2: async () => {
            //use async-await or promises
        }
    }`);
    // Remove binding from label, and add to onClick. Expect no error
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");
    _.propPane.UpdatePropertyFieldValue("Label", "Click here");
    _.propPane.EnterJSContext(
      "onClick",
      `{{
          () => {
          JSObject1.myFun1();
          JSObject1.myFun2()
      }}}`,
    );
    _.entityExplorer.ExpandCollapseEntity("Queries/JS");
    _.entityExplorer.SelectEntityByName("JSObject1", "Queries/JS");
    _.agHelper.AssertElementAbsence(_.locators._lintWarningElement);
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
      "JSObject1",
      "Delete",
      "Are you sure?",
    );
  });
});
