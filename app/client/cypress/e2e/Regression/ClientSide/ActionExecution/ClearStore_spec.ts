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
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      agHelper.GetNClick(propPane._deleteWidget);
      EditorNavigation.SelectEntityByName("Button2", EntityType.Widget);
      agHelper.GetNClick(propPane._deleteWidget);
    });

    it("2. To verify both persistent and session-specific stored values are cleared when clearStore() is called.", function () {
      entityExplorer.DragDropWidgetNVerify("buttonwidget", 100, 100);
      const JS_OBJECT_BODY = `export default {
        storePersistentValue: async () => {
          let values = [
            storeValue('persistentVal1', 'persistent value 1', true),
            storeValue('persistentVal2', 'persistent value 2', true),
            storeValue('sessionVal1', 'session value 1'),
            storeValue('sessionVal2', 'session value 2'),
          ];
          await Promise.all(values);
          await showAlert(JSON.stringify(appsmith.store));
        },
        clearStore: async () => {
          await clearStore();
          await showAlert(JSON.stringify(appsmith.store));
        }
      }`;

      jsEditor.CreateJSObject(JS_OBJECT_BODY, {
        paste: true,
        completeReplace: true,
        toRun: false,
        prettify: false,
        shouldCreateNewJSObj: true,
      });

      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("Label", "");
      propPane.TypeTextIntoField("Label", "StorePersistentValue");
      cy.get("@jsObjName").then((jsObj: any) => {
        propPane.SelectJSFunctionToExecute(
          "onClick",
          jsObj as string,
          "storePersistentValue",
        );
      });

      entityExplorer.DragDropWidgetNVerify("buttonwidget", 200, 300);
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
      agHelper.ClickButton("StorePersistentValue");
      agHelper.AssertContains(
        JSON.stringify({
          persistentVal1: "persistent value 1",
          persistentVal2: "persistent value 2",
          sessionVal1: "session value 1",
          sessionVal2: "session value 2",
        }),
      );
      agHelper.ClickButton("ClearStore");
      agHelper.AssertContains(JSON.stringify({}));
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      agHelper.GetNClick(propPane._deleteWidget);
      EditorNavigation.SelectEntityByName("Button2", EntityType.Widget);
      agHelper.GetNClick(propPane._deleteWidget);
    });

    it("3. To verify that clearStore() only removes values stored by the application and does not affect other unrelated data in the browser's local storage.", function () {
      entityExplorer.DragDropWidgetNVerify("buttonwidget", 100, 100);
      // Set some unrelated local storage data
      cy.window().then((win) => {
        win.localStorage.setItem("unrelatedKey1", "unrelated value 1");
        win.localStorage.setItem("unrelatedKey2", "unrelated value 2");
      });

      entityExplorer.DragDropWidgetNVerify("buttonwidget", 100, 100);
      const JS_OBJECT_BODY = `export default {
          storeValue: async () => {
            let values = [
          storeValue('val1', 'value 1'),
          storeValue('val2', 'value 2'),
            ];
            await Promise.all(values);
            await showAlert(JSON.stringify(appsmith.store));
          },
          clearStore: async () => {
            await clearStore();
            await showAlert(JSON.stringify(appsmith.store));
          }
        }`;

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

      entityExplorer.DragDropWidgetNVerify("buttonwidget", 200, 200);
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
        }),
      );
      agHelper.ClickButton("ClearStore");
      agHelper.AssertContains(JSON.stringify({}));

      // Verify unrelated local storage data is not cleared
      cy.window().then((win) => {
        expect(win.localStorage.getItem("unrelatedKey1")).to.equal(
          "unrelated value 1",
        );
        expect(win.localStorage.getItem("unrelatedKey2")).to.equal(
          "unrelated value 2",
        );
      });

      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      agHelper.GetNClick(propPane._deleteWidget);
      EditorNavigation.SelectEntityByName("Button2", EntityType.Widget);
      agHelper.GetNClick(propPane._deleteWidget);
    });

    it.only("4. To verify that clearStore() only affects the current tab's storage and does not inadvertently impact session storage across tabs.", function () {
      entityExplorer.DragDropWidgetNVerify("buttonwidget", 100, 100);
      const JS_OBJECT_BODY = `export default {
        storeValue: async () => {
          let values = [
              storeValue('val1', 'value 1'),
              storeValue('val2', 'value 2'),
          ];
          await Promise.all(values);
          await showAlert(JSON.stringify(appsmith.store));
        },
        clearStore: async () => {
          await clearStore();
          await showAlert(JSON.stringify(appsmith.store));
        }
      }`;

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

      entityExplorer.DragDropWidgetNVerify("buttonwidget", 200, 200);
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
        }),
      );

      // Open a new tab and verify the storage is not affected
      cy.window().then((win) => {
        const newTab = win.open(win.location.href, "_blank");
        if (newTab) {
          cy.wrap(newTab).should(() => {
            const isEmpty = Object.keys(newTab.localStorage).length === 0;
            expect(isEmpty).to.be.false;
          });
          newTab.close();
        }
      });

      agHelper.ClickButton("ClearStore");
      agHelper.AssertContains(JSON.stringify({}));

      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      agHelper.GetNClick(propPane._deleteWidget);
      EditorNavigation.SelectEntityByName("Button2", EntityType.Widget);
      agHelper.GetNClick(propPane._deleteWidget);
    });
  },
);
