import {
  agHelper,
  entityExplorer,
  jsEditor,
  locators,
  propPane,
} from "../../../../support/Objects/ObjectsCore";

describe("Responsiveness of linting", () => {
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

    entityExplorer.SelectEntityByName("Button1", "Widgets");
    agHelper.AssertElementAbsence(locators._lintErrorElement);
    agHelper.RefreshPage();
    entityExplorer.SelectEntityByName("JSObject1", "Queries/JS");
    jsEditor.RenameJSObjFromPane("JSObject2");
    entityExplorer.SelectEntityByName("Button1", "Widgets");
    agHelper.AssertElementAbsence(locators._lintErrorElement);
  });
});
