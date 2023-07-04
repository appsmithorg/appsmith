import {
  agHelper,
  entityExplorer,
  jsEditor,
  propPane,
  deployMode,
} from "../../../../support/Objects/ObjectsCore";

describe("removeValue Action test", () => {
  before(() => {
    entityExplorer.DragDropWidgetNVerify("buttonwidget", 100, 100);
    entityExplorer.NavigateToSwitcher("Explorer");
  });

  it("1. Feature 11639 : Remove store value", function () {
    const JS_OBJECT_BODY = `export default {
        storeValue: async () => {
            await storeValue('val1', 'value 1');
            await storeValue('val2', 'value 2');
            await showAlert(JSON.stringify(appsmith.store));
        },
        removeValue: async () => {
            await removeValue('val1');
            await showAlert(JSON.stringify(appsmith.store))
        }
    }`;

    // Create js object
    jsEditor.CreateJSObject(JS_OBJECT_BODY, {
      paste: true,
      completeReplace: true,
      toRun: false,
      prettify: false,
      shouldCreateNewJSObj: true,
    });

    entityExplorer.SelectEntityByName("Button1", "Widgets");
    propPane.UpdatePropertyFieldValue("Label", "");
    propPane.TypeTextIntoField("Label", "StoreValue");
    cy.get("@jsObjName").then((jsObj: any) => {
      propPane.SelectJSFunctionToExecute(
        "onClick",
        jsObj as string,
        "storeValue",
      );
    });

    entityExplorer.DragDropWidgetNVerify("buttonwidget", 100, 200);
    entityExplorer.SelectEntityByName("Button2", "Widgets");
    propPane.UpdatePropertyFieldValue("Label", "");
    propPane.TypeTextIntoField("Label", "RemoveValue");
    cy.get("@jsObjName").then((jsObj: any) => {
      propPane.SelectJSFunctionToExecute(
        "onClick",
        jsObj as string,
        "removeValue",
      );
    });

    deployMode.DeployApp();
    agHelper.ClickButton("StoreValue");
    agHelper.AssertContains(
      JSON.stringify({
        val1: "value 1",
        val2: "value 2",
      }),
    );
    agHelper.ClickButton("RemoveValue");
    agHelper.AssertContains(
      JSON.stringify({
        val2: "value 2",
      }),
    );
    deployMode.NavigateBacktoEditor();
  });
});
