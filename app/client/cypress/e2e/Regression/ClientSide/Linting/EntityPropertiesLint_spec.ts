import {
  agHelper,
  entityExplorer,
  jsEditor,
  propPane,
  entityItems,
  apiPage,
  draggableWidgets,
  locators,
} from "../../../../support/Objects/ObjectsCore";
import datasourceFormData from "../../../../fixtures/datasources.json";

describe("Linting of entity properties", () => {
  before(() => {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON, 300, 300);
    entityExplorer.NavigateToSwitcher("Explorer");
  });

  it("1. Shows correct lint error when wrong Api property is binded", () => {
    const invalidProperty = "unknownProperty";
    // create Api1
    apiPage.CreateAndFillApi(datasourceFormData.mockApiUrl);
    // Edit Button onclick property
    entityExplorer.SelectEntityByName("Button1", "Widgets");
    propPane.EnterJSContext(
      "onClick",
      `{{function(){
        console.log(Api1.${invalidProperty})
    }()}}`,
    );
    cy.wait(200);
    cy.focused().blur();
    propPane.UpdatePropertyFieldValue("Label", `{{Api1.${invalidProperty}}}`);
    cy.get(locators._lintErrorElement)
      .should("have.length", 2)
      .first()
      .trigger("mouseover");
    agHelper.AssertContains(`"${invalidProperty}" doesn't exist in Api1`);
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
    entityExplorer.SelectEntityByName("Button1", "Widgets");
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
    cy.get(locators._lintErrorElement)
      .should("have.length", 2)
      .first()
      .trigger("mouseover");
    agHelper.AssertContains(`"${invalidProperty}" doesn't exist in JSObject1`);

    // Edit JS Object and add "unknown" function
    entityExplorer.SelectEntityByName("JSObject1", "Queries/JS");
    jsEditor.EditJSObj(`export default {
      ${invalidProperty}: () => {
        console.log("JSOBJECT 1")
      }
  }`);
    // select button, and assert that no lint is present
    entityExplorer.SelectEntityByName("Button1", "Widgets");
    agHelper.AssertElementAbsence(locators._lintErrorElement);
    // delete JSObject
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "JSObject1",
      action: "Delete",
      entityType: entityItems.JSObject,
    });
    // select button, and assert that lint error is present
    entityExplorer.SelectEntityByName("Button1", "Widgets");
    cy.get(locators._lintErrorElement)
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
    entityExplorer.SelectEntityByName("Button1", "Widgets");
    agHelper.AssertElementAbsence(locators._lintErrorElement);
  });
});
