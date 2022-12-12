import * as _objects from "../../../../support/Objects/ObjectsCore"

describe("clearStore Action test", () => {
  before(() => {
    _objects.ee.DragDropWidgetNVerify("buttonwidget", 100, 100);
    _objects.ee.NavigateToSwitcher("explorer");
  });

  it("1. Feature 11639 : Clear all store value", function() {
    const JS_OBJECT_BODY = `export default {
        storeValue: async () => {
            let values =
              [
                storeValue('val1', 'value 1'),
                storeValue('val2', 'value 2'),
                storeValue('val3', 'value 3'),
              ];
            await Promise.all(values);
            await showAlert(JSON.stringify(appsmith.store));
        },
        clearStore: async () => {
            await clearStore();
            await showAlert(JSON.stringify(appsmith.store));
        }
    }`;

    // Create js object
    _objects.jsEditor.CreateJSObject(JS_OBJECT_BODY, {
      paste: true,
      completeReplace: true,
      toRun: false,
      prettify: false,
      shouldCreateNewJSObj: true,
    });

    _objects.ee.SelectEntityByName("Button1", "Widgets");
    _objects.propPane.UpdatePropertyFieldValue("Label", "");
    _objects.propPane.TypeTextIntoField("Label", "StoreValue");
    cy.get("@jsObjName").then((jsObj: any) => {
      _objects.propPane.SelectJSFunctionToExecute(
        "onClick",
        jsObj as string,
        "storeValue",
      );
    });

    _objects.ee.DragDropWidgetNVerify("buttonwidget", 100, 200);
    _objects.ee.SelectEntityByName("Button2", "Widgets");
    _objects.propPane.UpdatePropertyFieldValue("Label", "");
    _objects.propPane.TypeTextIntoField("Label", "ClearStore");
    cy.get("@jsObjName").then((jsObj: any) => {
      _objects.propPane.SelectJSFunctionToExecute(
        "onClick",
        jsObj as string,
        "clearStore",
      );
    });

    _objects.deployMode.DeployApp();
    _objects.agHelper.ClickButton("StoreValue");
    _objects.agHelper.AssertContains(
      JSON.stringify({
        val1: "value 1",
        val2: "value 2",
        val3: "value 3",
      }),
    );
    _objects.agHelper.ClickButton("ClearStore");
    _objects.agHelper.AssertContains(JSON.stringify({}));
    _objects.deployMode.NavigateBacktoEditor();
  });
});
