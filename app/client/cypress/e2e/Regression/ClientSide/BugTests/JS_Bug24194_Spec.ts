import {
  agHelper,
  entityExplorer,
  jsEditor,
  locators,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Responsiveness of linting",
  { tags: ["@tag.JS", "@tag.Binding"] },
  () => {
    before(() => {
      entityExplorer.DragDropWidgetNVerify("buttonwidget", 300, 300);
    });
    it("Should update linting when entity is added/renamed", () => {
      const JS_OBJECT = `export default {
        myFun1: () => {
          return "";
        },
        myFun2: ()=>{
         return ""
        }
      }`;
      propPane.UpdatePropertyFieldValue("Tooltip", "{{JSObject1.myFun1}}");
      agHelper.AssertElementExist(locators._lintErrorElement);
      jsEditor.CreateJSObject(JS_OBJECT, {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
      });

      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      agHelper.AssertElementAbsence(locators._lintErrorElement);
      agHelper.RefreshPage();
      EditorNavigation.SelectEntityByName("JSObject1", EntityType.JSObject);
      jsEditor.RenameJSObjFromPane("JSObject2");
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      agHelper.AssertElementAbsence(locators._lintErrorElement);
    });
  },
);
