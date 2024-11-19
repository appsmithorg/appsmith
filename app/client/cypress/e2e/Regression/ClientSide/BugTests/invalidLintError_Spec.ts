import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const jsEditor = ObjectsRegistry.JSEditor,
  locator = ObjectsRegistry.CommonLocators,
  ee = ObjectsRegistry.EntityExplorer,
  agHelper = ObjectsRegistry.AggregateHelper;

describe("Linting", { tags: ["@tag.JS", "@tag.Binding"] }, () => {
  before(() => {
    ee.DragDropWidgetNVerify("buttonwidget", 300, 300);
  });

  it("Should not show invalid errors for computed expressions", () => {
    const JSObjectWithoutLintError = `export default {
        myFun1: ()=>{
            const buttonName = Button1.text
            const buttonVisible = Button1["isVisible"]
            const disabled = "isDisabled"
            // Disable Linting for next line
            const buttonDisabled = Button1[disabled]
            return buttonName + buttonVisible + buttonDisabled
        }
    }`;

    const JSObjectWithLintError = `export default {
        myFun1: ()=>{
            // First Lint Error
            const buttonName = Button1["unknownProperty"]
            // Second Lint Error
            const buttonVisible = Button1.unknown
            const prop = "isDisabled"
            // Ignored lint error
            const buttonDisabled = Button1[prop]
            return buttonName + buttonVisible + buttonDisabled
        }
    }`;

    jsEditor.CreateJSObject(JSObjectWithoutLintError, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
      prettify: false,
    });
    // expect no lint error
    agHelper.AssertElementAbsence(locator._lintErrorElement);

    jsEditor.CreateJSObject(JSObjectWithLintError, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
      prettify: false,
    });

    // expect two lint errors here
    cy.get(locator._lintErrorElement).should("have.length", 2);
  });
});
