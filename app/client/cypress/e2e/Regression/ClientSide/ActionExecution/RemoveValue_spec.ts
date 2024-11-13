import {
  agHelper,
  deployMode,
  entityExplorer,
  jsEditor,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
  PageLeftPane,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "removeValue Action test",
  { tags: ["@tag.JS", "@tag.Binding"] },
  () => {
    before(() => {
      entityExplorer.DragDropWidgetNVerify("buttonwidget", 100, 100);
      PageLeftPane.switchSegment(PagePaneSegment.JS);
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
  },
);
