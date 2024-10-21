import {
  agHelper,
  deployMode,
  entityExplorer,
  jsEditor,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "clearStore Action test",
  { tags: ["@tag.JS", "@tag.Binding"] },
  () => {
    before(() => {
      entityExplorer.DragDropWidgetNVerify("buttonwidget", 100, 100);
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
      jsEditor.CreateJSObject(JS_OBJECT_BODY, {
        paste: true,
        completeReplace: true,
        toRun: false,
        prettify: false,
        shouldCreateNewJSObj: true,
      });

      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
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
      EditorNavigation.SelectEntityByName("Button2", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("Label", "");
      propPane.TypeTextIntoField("Label", "ClearStore");
      cy.get("@jsObjName").then((jsObj: any) => {
        propPane.SelectJSFunctionToExecute(
          "onClick",
          jsObj as string,
          "clearStore",
        );
      });

      deployMode.DeployApp();
      agHelper.ClickButton("StoreValue");
      agHelper.AssertContains(
        JSON.stringify({
          val1: "value 1",
          val2: "value 2",
          val3: "value 3",
        }),
      );
      agHelper.ClickButton("ClearStore");
      agHelper.AssertContains(JSON.stringify({}));
      deployMode.NavigateBacktoEditor();
    });
  },
);
