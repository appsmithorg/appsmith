import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const jsEditor = ObjectsRegistry.JSEditor,
  locator = ObjectsRegistry.CommonLocators,
  ee = ObjectsRegistry.EntityExplorer,
  apiPage = ObjectsRegistry.ApiPage,
  propPane = ObjectsRegistry.PropertyPane;

describe("Linting for incorrect paths", () => {
  before(() => {
    ee.DragDropWidgetNVerify("buttonwidget", 300, 300);
  });

  it("1. TC. 1975 - Linting is reactive for incorrect paths", () => {
    const JS_OBJECT_BODY = `export default {
        myVar1: [],
        myVar2: {},
        myFun1: () => {
            //write code here
        }, 
        myFun2: async () => {
            //use async-await or promises
        }
    }`;
    // create js object
    jsEditor.CreateJSObject(JS_OBJECT_BODY, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });
    // create api
    apiPage.CreateApi();

    ee.SelectEntityByName("Button1");
    propPane.UpdatePropertyFieldValue("Label", `{{JSObject1.unknown}}`);
    propPane.UpdatePropertyFieldValue("Tooltip", `{{Api1.unknown2}}`);
    jsEditor.EnterJSContext("onClick", `{{JSObject1.unknown3()}}`, true, true);
    cy.contains(locator._lintErrorElement).should("not.exist");

    ee.ExpandCollapseEntity("QUERIES/JS");
    // Delete JSObject & Api
    ee.ActionContextMenuByEntityName("JSObject1", "Delete", "Are you sure?");
    ee.ActionContextMenuByEntityName("Api1", "Delete", "Are you sure?");

    ee.SelectEntityByName("Button1");
    cy.contains(locator._lintErrorElement).should("have.length", 3);

    // Recreate jsobject & Api
    jsEditor.CreateJSObject(JS_OBJECT_BODY, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });
    apiPage.CreateApi();

    ee.SelectEntityByName("Button1");
    cy.contains(locator._lintErrorElement).should("not.exist");

    ee.DragDropWidgetNVerify("buttonwidget", 500, 600);
    propPane.UpdatePropertyFieldValue("Label", `{{JSObject2.unknown}}`);

    ee.SelectEntityByName("Button2");
    cy.contains(locator._lintErrorElement).should("have.length", 1);

    jsEditor.CreateJSObject(JS_OBJECT_BODY, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });
    ee.SelectEntityByName("Button2");
    cy.contains(locator._lintErrorElement).should("not.exist");
  });
});
