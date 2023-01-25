import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const jsEditor = ObjectsRegistry.JSEditor,
  locator = ObjectsRegistry.CommonLocators,
  ee = ObjectsRegistry.EntityExplorer,
  apiPage = ObjectsRegistry.ApiPage,
  agHelper = ObjectsRegistry.AggregateHelper,
  propPane = ObjectsRegistry.PropertyPane;

describe("Linting of entity properties", () => {
  before(() => {
    ee.DragDropWidgetNVerify("buttonwidget", 300, 300);
  });

  it("1. Shows correct lint error when wrong Api property is binded", () => {
    const invalidProperty = "unknownProperty";
    // create Api1
    apiPage.CreateAndFillApi("https://jsonplaceholder.typicode.com/");
    agHelper.BlurFocusedElement();
    // Edit Button onclick property
    ee.SelectEntityByName("Button1", "Widgets");
    propPane.EnterJSContext(
      "onClick",
      `{{function(){
        console.log(Api1.${invalidProperty})
    }()}}`,
    );
    cy.wait(200);
    cy.focused().blur();
    propPane.UpdatePropertyFieldValue("Label", `{{Api1.${invalidProperty}}}`);
    cy.get(locator._lintErrorElement)
      .should("have.length", 2)
      .first()
      .trigger("mouseover");
    agHelper
      .AssertContains(`"${invalidProperty}" doesn't exist in Api1`)
      .should("exist");
  });

  it("2. Shows correct lint error when wrong JSObject property is binded", () => {
    // create JSObject
    jsEditor.CreateJSObject(
      `export default {
      myFun1: () => {
        console.log("JSOBJECT 1")
      }
  }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
      },
    );
    const invalidProperty = "unknownFunction";
    // Edit Button onclick and text property
    ee.SelectEntityByName("Button1", "Widgets");
    propPane.EnterJSContext(
      "onClick",
      `{{function(){
        console.log(JSObject1.${invalidProperty})
    }()}}`,
    );
    cy.wait(200);
    propPane.UpdatePropertyFieldValue(
      "Label",
      `{{JSObject1.${invalidProperty}}}`,
    );
    // Assert lint errors
    cy.get(locator._lintErrorElement)
      .should("have.length", 2)
      .first()
      .trigger("mouseover");
    agHelper.AssertContains(`"${invalidProperty}" doesn't exist in JSObject1`);

    // Edit JS Object and add "unknown" function
    ee.SelectEntityByName("JSObject1", "Queries/JS");
    jsEditor.EditJSObj(`export default {
      ${invalidProperty}: () => {
        console.log("JSOBJECT 1")
      }
  }`);
    // select button, and assert that no lint is present
    ee.SelectEntityByName("Button1", "Widgets");
    agHelper.AssertElementAbsence(locator._lintErrorElement);
    // delete JSObject
    ee.ActionContextMenuByEntityName("JSObject1", "Delete", "Are you sure?");
    // select button, and assert that lint error is present
    ee.SelectEntityByName("Button1", "Widgets");
    cy.get(locator._lintErrorElement)
      .should("have.length", 2)
      .first()
      .trigger("mouseover");
    agHelper.AssertContains(`'JSObject1' is not defined`);
    // create js object
    jsEditor.CreateJSObject(
      `export default {
        ${invalidProperty}: () => {
        console.log("JSOBJECT 1")
      }
  }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
      },
    );

    // select button, and assert that no lint error is present
    ee.SelectEntityByName("Button1", "Widgets");
    cy.get(locator._lintErrorElement).should("not.exist");
  });
});
