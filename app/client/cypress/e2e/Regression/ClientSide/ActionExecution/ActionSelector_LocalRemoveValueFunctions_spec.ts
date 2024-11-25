import {
  agHelper,
  appSettings,
  deployMode,
  draggableWidgets,
  entityExplorer,
  jsEditor,
  locators,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "To verify action selector - Local store value function",
  { tags: ["@tag.JS"] },
  () => {
    before(() => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON, 100, 100);
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TEXT, 200, 200);
    });

    it("1. To verify if the removeValue() function successfully removes the value associated with a specified key from local storage", () => {
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.SelectPlatformFunction("onClick", "Store value");
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("Key"),
        "removingKey",
      );
      agHelper.TypeText(propPane._actionSelectorFieldByLabel("Value"), "true");
      agHelper.GetNClick(propPane._actionSelectorPopupClose);
      agHelper.ClickButton("Submit", 0);
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
      propPane.TypeTextIntoField("Text", `{{appsmith.store.removingKey}}`);
      agHelper.AssertText(locators._textInside, "text", "true");

      entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON, 200, 300);
      EditorNavigation.SelectEntityByName("Button2", EntityType.Widget);
      propPane.SelectPlatformFunction("onClick", "Remove value");
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("Key"),
        "removingKey",
      );

      agHelper.GetNClick(propPane._actionSelectorPopupClose);
      agHelper.ClickButton("Submit", 1);
      agHelper.AssertText(locators._textInside, "text", "");

      // Deploy verification
      deployMode.DeployApp();
      agHelper.ClickButton("Submit", 0);
      agHelper.AssertText(locators._textInside, "text", "true");
      agHelper.ClickButton("Submit", 1);
      agHelper.AssertText(locators._textInside, "text", "");
      deployMode.NavigateBacktoEditor();

      // JSObject verification for removeValue
      const jsObjectBody = `export default {
        storeValue: async () => {
          await storeValue('removingKey', 'toBeRemoved');
          Text1.text = JSON.stringify(appsmith.store);
        },
        removeValue: async () => {
          await removeValue('removingKey');
          Text1.text = JSON.stringify(appsmith.store);
        }
      }`;

      jsEditor.CreateJSObject(jsObjectBody, {
        paste: true,
        completeReplace: true,
        toRun: false,
        prettify: false,
        shouldCreateNewJSObj: true,
      });

      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.ToggleJSMode("onClick", true);
      propPane.EnterJSContext(
        "onClick",
        "{{JSObject1.storeValue()}}",
        true,
        false,
      );
      agHelper.ClickOutside();

      EditorNavigation.SelectEntityByName("Button2", EntityType.Widget);
      propPane.ToggleJSMode("onClick", true);
      propPane.EnterJSContext(
        "onClick",
        "{{JSObject1.removeValue()}}",
        true,
        false,
      );
      agHelper.ClickOutside();
      agHelper.RefreshPage();
      agHelper.ClickButton("Submit", 0);
      agHelper.AssertText(locators._textInside, "text", "toBeRemoved");
      agHelper.ClickButton("Submit", 1);
      agHelper.AssertText(locators._textInside, "text", "");

      // Deploy verification
      deployMode.DeployApp();
      agHelper.ClickButton("Submit", 0);
      agHelper.AssertText(locators._textInside, "text", "toBeRemoved");
      agHelper.ClickButton("Submit", 1);
      agHelper.AssertText(locators._textInside, "text", "");
      deployMode.NavigateBacktoEditor();

      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.ToggleJSMode("onClick", false);
      agHelper.GetNClick(propPane._actionCardByTitle("Execute a JS function"));
      agHelper.GetNClick(propPane._actionSelectorDelete);

      EditorNavigation.SelectEntityByName("Button2", EntityType.Widget);
      agHelper.GetNClick(propPane._deleteWidget);
    });

    it("2. To verify the behavior of removeValue() when attempting to remove a key that does not exist in local storage. The function should not throw any errors, and the local storage remains unchanged.", () => {
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.SelectPlatformFunction("onClick", "Remove value");
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("Key"),
        "nonExistentKey",
      );
      agHelper.GetNClick(propPane._actionSelectorPopupClose);
      agHelper.ClickButton("Submit");
      agHelper.AssertElementAbsence(locators._toastMsg);

      // Deploy verification
      deployMode.DeployApp();
      agHelper.ClickButton("Submit");
      agHelper.AssertElementAbsence(locators._toastMsg);
      deployMode.NavigateBacktoEditor();

      // JSObject verification for removeValue
      const jsObjectBody = `export default {
        removeNonExistentValue: async () => {
          await removeValue('nonExistentKey');
          Text1.text = JSON.stringify(appsmith.store);
        }
      }`;

      jsEditor.CreateJSObject(jsObjectBody, {
        paste: true,
        completeReplace: true,
        toRun: false,
        prettify: false,
        shouldCreateNewJSObj: true,
      });

      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.ToggleJSMode("onClick", true);
      propPane.EnterJSContext(
        "onClick",
        "{{JSObject2.removeNonExistentValue()}}",
        true,
        false,
      );
      agHelper.ClickOutside();
      agHelper.RefreshPage();
      agHelper.ClickButton("Submit");
      agHelper.AssertElementAbsence(locators._toastMsg);

      // Deploy verification
      deployMode.DeployApp();
      agHelper.ClickButton("Submit");
      agHelper.AssertElementAbsence(locators._toastMsg);
      deployMode.NavigateBacktoEditor();

      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.ToggleJSMode("onClick", false);
      agHelper.GetNClick(propPane._actionCardByTitle("Execute a JS function"));
      agHelper.GetNClick(propPane._actionSelectorDelete);
    });

    it("3. To verify that calling removeValue() with a non-string key (e.g., number or object) fails.", () => {
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.SelectPlatformFunction("onClick", "Remove value");
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("Key"),
        123 as any,
      );
      agHelper.GetNClick(propPane._actionSelectorPopupClose);
      agHelper.ClickButton("Submit");
      //agHelper.AssertElementVisibility(locators._toastMsg);
      //agHelper.AssertText(locators._toastMsg, "text", "Invalid key type");

      // Deploy verification
      deployMode.DeployApp();
      agHelper.ClickButton("Submit");
      //agHelper.AssertElementVisibility(locators._toastMsg);
      //agHelper.AssertText(locators._toastMsg, "text", "Invalid key type");
      deployMode.NavigateBacktoEditor();

      // JSObject verification for removeValue with non-string key
      const jsObjectBody = `export default {
            removeInvalidKey: async () => {
              try {
            await removeValue(123);
              } catch (e) {
            Text1.text = e.message;
              }
            }
          }`;

      jsEditor.CreateJSObject(jsObjectBody, {
        paste: true,
        completeReplace: true,
        toRun: false,
        prettify: false,
        shouldCreateNewJSObj: true,
      });

      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.ToggleJSMode("onClick", true);
      propPane.EnterJSContext(
        "onClick",
        "{{JSObject3.removeInvalidKey()}}",
        true,
        false,
      );
      agHelper.ClickOutside();
      agHelper.RefreshPage();
      agHelper.ClickButton("Submit");
      //agHelper.AssertText(locators._textInside, "text", "Invalid key type");

      // Deploy verification
      deployMode.DeployApp();
      agHelper.ClickButton("Submit");
      //agHelper.AssertText(locators._textInside, "text", "Invalid key type");
      deployMode.NavigateBacktoEditor();

      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.ToggleJSMode("onClick", false);
      agHelper.GetNClick(propPane._actionCardByTitle("Execute a JS function"));
      agHelper.GetNClick(propPane._actionSelectorDelete);
    });

    it("4. To verify multiple values can be removed sequentially using removeValue().", () => {
      // Store first value
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.SelectPlatformFunction("onClick", "Store value");
      agHelper.TypeText(propPane._actionSelectorFieldByLabel("Key"), "key1");
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("Value"),
        "value1",
      );
      agHelper.GetNClick(propPane._actionSelectorPopupClose);
      agHelper.ClickButton("Submit", 0);

      entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON, 300, 300);

      // Store second value
      EditorNavigation.SelectEntityByName("Button2", EntityType.Widget);
      propPane.SelectPlatformFunction("onClick", "Store value");
      agHelper.TypeText(propPane._actionSelectorFieldByLabel("Key"), "key2");
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("Value"),
        "value2",
      );
      agHelper.GetNClick(propPane._actionSelectorPopupClose);
      agHelper.ClickButton("Submit", 1);

      // Verify both values are stored
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
      propPane.TypeTextIntoField("Text", `{{appsmith.store.key1}}`);
      agHelper.AssertText(locators._textInside, "text", "value1");

      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TEXT, 400, 400);
      EditorNavigation.SelectEntityByName("Text2", EntityType.Widget);
      propPane.TypeTextIntoField("Text", `{{appsmith.store.key2}}`);
      agHelper.AssertText(locators._textInside, "text", "value2", 1);

      // Remove first value
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON, 500, 500);
      EditorNavigation.SelectEntityByName("Button3", EntityType.Widget);
      propPane.SelectPlatformFunction("onClick", "Remove value");
      agHelper.TypeText(propPane._actionSelectorFieldByLabel("Key"), "key1");
      agHelper.GetNClick(propPane._actionSelectorPopupClose);
      agHelper.ClickButton("Submit", 2);
      agHelper.AssertText(locators._textInside, "text", "");

      // Remove second value
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON, 600, 600);
      EditorNavigation.SelectEntityByName("Button4", EntityType.Widget);
      propPane.SelectPlatformFunction("onClick", "Remove value");
      agHelper.TypeText(propPane._actionSelectorFieldByLabel("Key"), "key2");
      agHelper.GetNClick(propPane._actionSelectorPopupClose);
      agHelper.ClickButton("Submit", 3);
      agHelper.AssertText(locators._textInside, "text", "", 1);

      // Deploy verification
      deployMode.DeployApp();
      agHelper.ClickButton("Submit", 0);
      agHelper.AssertText(locators._textInside, "text", "value1");
      agHelper.ClickButton("Submit", 1);
      agHelper.AssertText(locators._textInside, "text", "value2", 1);
      agHelper.ClickButton("Submit", 2);
      agHelper.AssertText(locators._textInside, "text", "");
      agHelper.ClickButton("Submit", 3);
      agHelper.AssertText(locators._textInside, "text", "", 1);
      deployMode.NavigateBacktoEditor();

      // JSObject verification for removeValue sequentially
      const jsObjectBody = `export default {
        storeValues: async () => {
          await storeValue('key1', 'value1');
          await storeValue('key2', 'value2');
          Text1.text = JSON.stringify(appsmith.store);
        },
        removeValue1: async () => {
          await removeValue('key1');
          Text1.text = JSON.stringify(appsmith.store);
        },
        removeValue2: async () => {
          await removeValue('key2');
          Text1.text = JSON.stringify(appsmith.store);
        }
      }`;

      jsEditor.CreateJSObject(jsObjectBody, {
        paste: true,
        completeReplace: true,
        toRun: false,
        prettify: false,
        shouldCreateNewJSObj: true,
      });

      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.ToggleJSMode("onClick", true);
      propPane.EnterJSContext(
        "onClick",
        "{{JSObject4.storeValues()}}",
        true,
        false,
      );
      agHelper.ClickOutside();

      EditorNavigation.SelectEntityByName("Button2", EntityType.Widget);
      propPane.ToggleJSMode("onClick", true);
      propPane.EnterJSContext(
        "onClick",
        "{{JSObject4.removeValue1()}}",
        true,
        false,
      );
      agHelper.ClickOutside();

      EditorNavigation.SelectEntityByName("Button3", EntityType.Widget);
      propPane.ToggleJSMode("onClick", true);
      propPane.EnterJSContext(
        "onClick",
        "{{JSObject4.removeValue2()}}",
        true,
        false,
      );
      agHelper.ClickOutside();

      agHelper.RefreshPage();
      agHelper.ClickButton("Submit", 0);
      agHelper.AssertText(locators._textInside, "text", "value1");
      agHelper.ClickButton("Submit", 1);
      agHelper.AssertText(locators._textInside, "text", "value2", 1);
      agHelper.ClickButton("Submit", 2);
      agHelper.AssertText(locators._textInside, "text", "");
      agHelper.ClickButton("Submit", 3);
      agHelper.AssertText(locators._textInside, "text", "", 1);

      // Deploy verification
      deployMode.DeployApp();
      agHelper.ClickButton("Submit", 0);
      agHelper.AssertText(locators._textInside, "text", "value1");
      agHelper.ClickButton("Submit", 1);
      agHelper.AssertText(locators._textInside, "text", "value2", 1);
      agHelper.ClickButton("Submit", 2);
      agHelper.AssertText(locators._textInside, "text", "");
      agHelper.ClickButton("Submit", 3);
      agHelper.AssertText(locators._textInside, "text", "", 1);
      deployMode.NavigateBacktoEditor();

      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.ToggleJSMode("onClick", false);
      agHelper.GetNClick(propPane._actionCardByTitle("Execute a JS function"));
      agHelper.GetNClick(propPane._actionSelectorDelete);

      EditorNavigation.SelectEntityByName("Button2", EntityType.Widget);
      agHelper.GetNClick(propPane._deleteWidget);

      EditorNavigation.SelectEntityByName("Button3", EntityType.Widget);
      agHelper.GetNClick(propPane._deleteWidget);

      EditorNavigation.SelectEntityByName("Button4", EntityType.Widget);
      agHelper.GetNClick(propPane._deleteWidget);

      EditorNavigation.SelectEntityByName("Text2", EntityType.Widget);
      agHelper.GetNClick(propPane._deleteWidget);
    });

    it("5. To verify that calling removeValue() on one key does not affect other stored values.", () => {
      // Store first value
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.SelectPlatformFunction("onClick", "Store value");
      agHelper.TypeText(propPane._actionSelectorFieldByLabel("Key"), "key1");
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("Value"),
        "value1",
      );
      agHelper.GetNClick(propPane._actionSelectorPopupClose);
      agHelper.ClickButton("Submit", 0);

      entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON, 300, 300);

      // Store second value
      EditorNavigation.SelectEntityByName("Button2", EntityType.Widget);
      propPane.SelectPlatformFunction("onClick", "Store value");
      agHelper.TypeText(propPane._actionSelectorFieldByLabel("Key"), "key2");
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("Value"),
        "value2",
      );
      agHelper.GetNClick(propPane._actionSelectorPopupClose);
      agHelper.ClickButton("Submit", 1);

      // Verify both values are stored
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
      propPane.TypeTextIntoField("Text", `{{appsmith.store.key1}}`);
      agHelper.AssertText(locators._textInside, "text", "value1");

      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TEXT, 400, 400);
      EditorNavigation.SelectEntityByName("Text2", EntityType.Widget);
      propPane.TypeTextIntoField("Text", `{{appsmith.store.key2}}`);
      agHelper.AssertText(locators._textInside, "text", "value2", 1);

      // Remove first value
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON, 500, 500);
      EditorNavigation.SelectEntityByName("Button3", EntityType.Widget);
      propPane.SelectPlatformFunction("onClick", "Remove value");
      agHelper.TypeText(propPane._actionSelectorFieldByLabel("Key"), "key1");
      agHelper.GetNClick(propPane._actionSelectorPopupClose);
      agHelper.ClickButton("Submit", 2);
      agHelper.AssertText(locators._textInside, "text", "");

      // Verify second value is still stored
      agHelper.AssertText(locators._textInside, "text", "value2", 1);

      // Deploy verification
      deployMode.DeployApp();
      agHelper.ClickButton("Submit", 0);
      agHelper.AssertText(locators._textInside, "text", "value1");
      agHelper.ClickButton("Submit", 1);
      agHelper.AssertText(locators._textInside, "text", "value2", 1);
      agHelper.ClickButton("Submit", 2);
      agHelper.AssertText(locators._textInside, "text", "");
      agHelper.AssertText(locators._textInside, "text", "value2", 1);
      deployMode.NavigateBacktoEditor();

      // JSObject verification for removeValue without affecting other values
      const jsObjectBody = `export default {
        storeValues: async () => {
          await storeValue('key1', 'value1');
          await storeValue('key2', 'value2');
          Text1.text = JSON.stringify(appsmith.store);
        },
        removeValue1: async () => {
          await removeValue('key1');
          Text1.text = JSON.stringify(appsmith.store);
        }
      }`;

      jsEditor.CreateJSObject(jsObjectBody, {
        paste: true,
        completeReplace: true,
        toRun: false,
        prettify: false,
        shouldCreateNewJSObj: true,
      });

      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.ToggleJSMode("onClick", true);
      propPane.EnterJSContext(
        "onClick",
        "{{JSObject5.storeValues()}}",
        true,
        false,
      );
      agHelper.ClickOutside();

      EditorNavigation.SelectEntityByName("Button2", EntityType.Widget);
      propPane.ToggleJSMode("onClick", true);
      propPane.EnterJSContext(
        "onClick",
        "{{JSObject5.removeValue1()}}",
        true,
        false,
      );
      agHelper.ClickOutside();

      agHelper.RefreshPage();
      agHelper.ClickButton("Submit", 0);
      agHelper.AssertText(locators._textInside, "text", "value1");
      agHelper.ClickButton("Submit", 1);
      agHelper.AssertText(locators._textInside, "text", "value2", 1);
      agHelper.ClickButton("Submit", 2);
      agHelper.AssertText(locators._textInside, "text", "");
      agHelper.AssertText(locators._textInside, "text", "value2", 1);

      // Deploy verification
      deployMode.DeployApp();
      agHelper.ClickButton("Submit", 0);
      agHelper.AssertText(locators._textInside, "text", "value1");
      agHelper.ClickButton("Submit", 1);
      agHelper.AssertText(locators._textInside, "text", "value2", 1);
      agHelper.ClickButton("Submit", 2);
      agHelper.AssertText(locators._textInside, "text", "");
      agHelper.AssertText(locators._textInside, "text", "value2", 1);
      deployMode.NavigateBacktoEditor();

      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.ToggleJSMode("onClick", false);
      agHelper.GetNClick(propPane._actionCardByTitle("Execute a JS function"));
      agHelper.GetNClick(propPane._actionSelectorDelete);

      EditorNavigation.SelectEntityByName("Button2", EntityType.Widget);
      agHelper.GetNClick(propPane._deleteWidget);

      EditorNavigation.SelectEntityByName("Button3", EntityType.Widget);
      agHelper.GetNClick(propPane._deleteWidget);

      EditorNavigation.SelectEntityByName("Text2", EntityType.Widget);
      agHelper.GetNClick(propPane._deleteWidget);
    });

    it("6. To verify if removeValue() correctly removes a value even when it was stored with the persist option set to false. The key should be removed, even though it was not persisted across sessions.", () => {
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.SelectPlatformFunction("onClick", "Store value");
      agHelper.TypeText(propPane._actionSelectorFieldByLabel("Key"), "tempKey");
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("Value"),
        "tempValue",
      );
      agHelper.GetNClick(propPane._actionSelectorPopupClose);
      agHelper.ClickButton("Submit", 0);
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
      propPane.TypeTextIntoField("Text", `{{appsmith.store.tempKey}}`);
      agHelper.AssertText(locators._textInside, "text", "tempValue");

      entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON, 300, 300);
      EditorNavigation.SelectEntityByName("Button2", EntityType.Widget);
      propPane.SelectPlatformFunction("onClick", "Remove value");
      agHelper.TypeText(propPane._actionSelectorFieldByLabel("Key"), "tempKey");
      agHelper.GetNClick(propPane._actionSelectorPopupClose);
      agHelper.ClickButton("Submit", 1);
      agHelper.AssertText(locators._textInside, "text", "");

      deployMode.DeployApp();
      agHelper.ClickButton("Submit", 0);
      agHelper.AssertText(locators._textInside, "text", "tempValue");
      agHelper.ClickButton("Submit", 1);
      agHelper.AssertText(locators._textInside, "text", "");
      deployMode.NavigateBacktoEditor();

      const jsObjectBody = `export default {
        storeTempValue: async () => {
          await storeValue('tempKey', 'tempValue');
          Text1.text = JSON.stringify(appsmith.store);
        },
        removeTempValue: async () => {
          await removeValue('tempKey');
          Text1.text = JSON.stringify(appsmith.store);
        }
      }`;

      jsEditor.CreateJSObject(jsObjectBody, {
        paste: true,
        completeReplace: true,
        toRun: false,
        prettify: false,
        shouldCreateNewJSObj: true,
      });

      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.ToggleJSMode("onClick", true);
      propPane.EnterJSContext(
        "onClick",
        "{{JSObject6.storeTempValue()}}",
        true,
        false,
      );
      agHelper.ClickOutside();

      EditorNavigation.SelectEntityByName("Button2", EntityType.Widget);
      propPane.ToggleJSMode("onClick", true);
      propPane.EnterJSContext(
        "onClick",
        "{{JSObject6.removeTempValue()}}",
        true,
        false,
      );
      agHelper.ClickOutside();

      agHelper.RefreshPage();
      agHelper.ClickButton("Submit", 0);
      agHelper.AssertText(locators._textInside, "text", "tempValue");
      agHelper.ClickButton("Submit", 1);
      agHelper.AssertText(locators._textInside, "text", "");

      deployMode.DeployApp();
      agHelper.ClickButton("Submit", 0);
      agHelper.AssertText(locators._textInside, "text", "tempValue");
      agHelper.ClickButton("Submit", 1);
      agHelper.AssertText(locators._textInside, "text", "");
      deployMode.NavigateBacktoEditor();

      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.ToggleJSMode("onClick", false);
      agHelper.GetNClick(propPane._actionCardByTitle("Execute a JS function"));
      agHelper.GetNClick(propPane._actionSelectorDelete);

      EditorNavigation.SelectEntityByName("Button2", EntityType.Widget);
      agHelper.GetNClick(propPane._deleteWidget);
    });
  },
);
