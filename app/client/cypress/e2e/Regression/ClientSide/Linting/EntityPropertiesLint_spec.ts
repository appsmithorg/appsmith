import {
  agHelper,
  entityExplorer,
  jsEditor,
  propPane,
  entityItems,
  apiPage,
  draggableWidgets,
  locators,
  dataManager,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
  PageLeftPane,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Linting of entity properties",
  { tags: ["@tag.JS", "@tag.Binding"] },
  () => {
    before(() => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON, 300, 300);
    });

    it("1. Shows correct lint error when wrong Api property is binded", () => {
      const invalidProperty = "unknownProperty";
      // create Api1
      apiPage.CreateAndFillApi(
        dataManager.dsValues[dataManager.defaultEnviorment].mockApiUrl,
      );
      // Edit Button onclick property
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.EnterJSContext(
        "onClick",
        `{{function(){
        console.log(Api1.${invalidProperty})
    }()}}`,
      );
      cy.wait(200);
      cy.focused().blur();
      propPane.UpdatePropertyFieldValue("Label", `{{Api1.${invalidProperty}}}`);
      agHelper.AssertElementLength(locators._lintErrorElement, 2);
      agHelper.HoverElement(locators._lintErrorElement);
      agHelper.AssertContains(`"${invalidProperty}" doesn't exist in Api1`);
      agHelper.GetNClick(locators._canvas);
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
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
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
      agHelper.AssertElementLength(locators._lintErrorElement, 2);
      agHelper.HoverElement(locators._lintErrorElement);
      agHelper.AssertContains(
        `"${invalidProperty}" doesn't exist in JSObject1`,
      );

      // Edit JS Object and add "unknown" function
      EditorNavigation.SelectEntityByName("JSObject1", EntityType.JSObject);
      jsEditor.EditJSObj(`export default {
      ${invalidProperty}: () => {
        console.log("JSOBJECT 1")
      }
  }`);
      // select button, and assert that no lint is present
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      agHelper.AssertElementAbsence(locators._lintErrorElement);
      // delete JSObject
      PageLeftPane.switchSegment(PagePaneSegment.JS);
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "JSObject1",
        action: "Delete",
        entityType: entityItems.JSObject,
      });
      // select button, and assert that lint error is present
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      agHelper.AssertElementLength(locators._lintErrorElement, 2);
      agHelper.HoverElement(locators._lintErrorElement);
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
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      agHelper.AssertElementAbsence(locators._lintErrorElement);
    });
  },
);
