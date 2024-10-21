import {
  agHelper,
  apiPage,
  entityExplorer,
  jsEditor,
  locators,
  propPane,
  entityItems,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
  PageLeftPane,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Linting async JSFunctions bound to data fields",
  { tags: ["@tag.JS", "@tag.Binding"] },
  () => {
    before(() => {
      entityExplorer.DragDropWidgetNVerify("buttonwidget", 300, 300);
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
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("Label", "{{JSObject1.myFun2()}}");
      agHelper.AssertElementVisibility(locators._evaluateMsg);
      agHelper.ContainsNClick("View source"); // should route to jsobject page

      agHelper.AssertElementLength(locators._lintWarningElement, 1);

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

      agHelper.AssertElementAbsence(locators._lintWarningElement);

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

      agHelper.AssertElementLength(locators._lintWarningElement, 1);
      MouseHoverNVerify(
        "myFun2",
        `Cannot bind async functions to data fields. Convert this to a sync function or remove references to "JSObject1.myFun2" on the following data field: Button1.text`,
        false,
      );

      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("Label", "{{JSObject1.myFun1()}}");
      agHelper.AssertElementVisibility(locators._evaluateMsg);
      agHelper.ContainsNClick("View source"); // should route to jsobject page
      agHelper.AssertElementLength(locators._lintWarningElement, 2);
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
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("Label", "Click here");
      propPane.EnterJSContext(
        "onClick",
        `{{
          () => {
          JSObject1.myFun1();
          JSObject1.myFun2()
      }}}`,
      );
      EditorNavigation.SelectEntityByName("JSObject1", EntityType.JSObject);
      agHelper.AssertElementAbsence(locators._lintWarningElement);
    });

    function MouseHoverNVerify(
      lintOn: string,
      debugMsg: string,
      isError = true,
    ) {
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
        entityNameinLeftSidebar: "JSObject1",
        action: "Delete",
        entityType: entityItems.JSObject,
      });
      PageLeftPane.switchSegment(PagePaneSegment.Queries);
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "Api1",
        action: "Delete",
        entityType: entityItems.Api,
      });
    });
  },
);
