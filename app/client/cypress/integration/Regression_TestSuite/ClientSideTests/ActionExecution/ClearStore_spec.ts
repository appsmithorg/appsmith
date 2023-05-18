import * as _ from "../../../../support/Objects/ObjectsCore";

describe("clearStore Action test", () => {
  before(() => {
    _.entityExplorer.DragDropWidgetNVerify("buttonwidget", 100, 100);
    _.entityExplorer.NavigateToSwitcher("explorer");
  });

  it("1. Feature 11639 : Clear all store value", function () {
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
    _.jsEditor.CreateJSObject(JS_OBJECT_BODY, {
      paste: true,
      completeReplace: true,
      toRun: false,
      prettify: false,
      shouldCreateNewJSObj: true,
    });

    _.entityExplorer.SelectEntityByName("Button1", "Widgets");
    _.propPane.UpdatePropertyFieldValue("Label", "");
    _.propPane.TypeTextIntoField("Label", "StoreValue");
    cy.get("@jsObjName").then((jsObj: any) => {
      _.propPane.SelectJSFunctionToExecute(
        "onClick",
        jsObj as string,
        "storeValue",
      );
    });

    _.entityExplorer.DragDropWidgetNVerify("buttonwidget", 100, 200);
    _.entityExplorer.SelectEntityByName("Button2", "Widgets");
    _.propPane.UpdatePropertyFieldValue("Label", "");
    _.propPane.TypeTextIntoField("Label", "ClearStore");
    cy.get("@jsObjName").then((jsObj: any) => {
      _.propPane.SelectJSFunctionToExecute(
        "onClick",
        jsObj as string,
        "clearStore",
      );
    });

    _.deployMode.DeployApp();
    _.agHelper.ClickButton("StoreValue");
    _.agHelper.AssertContains(
      JSON.stringify({
        val1: "value 1",
        val2: "value 2",
        val3: "value 3",
      }),
    );
    _.agHelper.ClickButton("ClearStore");
    _.agHelper.AssertContains(JSON.stringify({}));
    _.deployMode.NavigateBacktoEditor();
  });
});
