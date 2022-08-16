import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const jsEditor = ObjectsRegistry.JSEditor,
  ee = ObjectsRegistry.EntityExplorer,
  agHelper = ObjectsRegistry.AggregateHelper;

describe("Lint error reporting", () => {
  before(() => {
    ee.DragDropWidgetNVerify("tablewidgetv2", 300, 500);
    ee.DragDropWidgetNVerify("buttonwidget", 300, 300);
    ee.NavigateToSwitcher("explorer");
  });

  it("1. Shows empty page UI with invalid JS Object page url", () => {
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
    jsEditor.CreateJSObject(JS_OBJECT_BODY, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });
    cy.url().then((url) => {
      const invalidURL = url + "invalid";
      cy.visit(invalidURL);
      agHelper.Sleep(2000);
      cy.contains(`The page you’re looking for either does not exist`).should(
        "exist",
      );
    });
  });
});
