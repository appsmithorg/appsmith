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

    it("1. To verify if storeValue() can store a boolean value in local storage.", () => {
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.SelectPlatformFunction("onClick", "Store value");
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("Key"),
        "booleanKey",
      );
      agHelper.TypeText(propPane._actionSelectorFieldByLabel("Value"), "true");
      agHelper.GetNClick(propPane._actionSelectorPopupClose);
      agHelper.ClickButton("Submit");
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
      propPane.TypeTextIntoField(
        "Text",
        `{{localStorage.getItem("booleanKey")}}`,
      );
      agHelper.AssertText(locators._textInside, "text", "true");
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);

      //deploy verification
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.AssertText(locators._textInside, "text", "true");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);

      // JSobject verification
      const jsObjectBody = `export default {
          myFun1 () {
            {{storeValue('booleanKey', 'true');}}
          },
        }`;

      jsEditor.CreateJSObject(jsObjectBody, {
        paste: true,
        completeReplace: true,
        toRun: false,
        prettify: false,
        shouldCreateNewJSObj: true,
      });
      agHelper.GetText(jsEditor._jsObjName).then((jsObjectName: string) => {
        cy.wrap(jsObjectName).as("jsObjectName");
      });

      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.ToggleJSMode("onClick", true);
      cy.get("@jsObjectName").then((jsObjectName: string) => {
        console.log("Mera variable: ", jsObjectName);
        propPane.EnterJSContext(
          "onClick",
          `{{${jsObjectName}.myFun1()}}`,
          true,
          false,
        );
      });
      agHelper.ClickButton("Submit");
      agHelper.AssertText(locators._textInside, "text", "true");
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.AssertText(locators._textInside, "text", "true");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.ToggleJSMode("onClick", false);
      agHelper.GetNClick(propPane._actionCardByTitle("Execute a JS function"));
      agHelper.GetNClick(propPane._actionSelectorDelete);
    });

    it("2. To verify that when the persist parameter is set to false, the value is not saved after refreshing the page.", () => {
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.ToggleJSMode("onClick", false);
      propPane.SelectPlatformFunction("onClick", "Store value");
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("Key"),
        "booleanKey",
      );
      agHelper.TypeText(propPane._actionSelectorFieldByLabel("Value"), "false");
      agHelper.RefreshPage();
      agHelper.AssertText(locators._textInside, "text", "true");
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.ToggleJSMode("onClick", false);
      agHelper.GetNClick(propPane._actionCardByTitle("Store value"));
      agHelper.GetNClick(propPane._actionSelectorDelete);
    });

    it("3. To verify value stored under a key can be successfully overwritten.", () => {
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.SelectPlatformFunction("onClick", "Store value");
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("Key"),
        "booleanKey",
      );
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("Value"),
        "oldValue",
      );
      agHelper.GetNClick(propPane._actionSelectorPopupClose);
      agHelper.ClickButton("Submit");
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
      propPane.TypeTextIntoField(
        "Text",
        `{{localStorage.getItem("booleanKey")}}`,
      );

      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      agHelper.GetNClick(propPane._actionCardByTitle("Store value"));
      agHelper.RemoveChars(
        propPane._actionSelectorFieldByLabel("Value"),
        20,
        0,
      );

      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("Value"),
        "newValue",
      );
      agHelper.GetNClick(propPane._actionSelectorPopupClose);
      agHelper.ClickButton("Submit");

      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
      agHelper.WaitUntilEleAppear(locators._textInside);
      propPane.TypeTextIntoField(
        "Text",
        `{{localStorage.getItem("booleanKey")}}`,
      );

      agHelper.AssertText(locators._textInside, "text", "newValue");
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      agHelper.GetNClick(propPane._actionCardByTitle("Store value"));
      agHelper.GetNClick(propPane._actionSelectorDelete);
    });

    // Open bug present : https://github.com/appsmithorg/appsmith/issues/37671
    it.skip("4. To verify that calling storeValue() without a key parameter does not store any value.", () => {
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.SelectPlatformFunction("onClick", "Store value");
      agHelper.TypeText(propPane._actionSelectorFieldByLabel("Value"), "true");
      agHelper.GetNClick(propPane._actionSelectorPopupClose);
      agHelper.ClickButton("Submit");
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
      propPane.TypeTextIntoField("Text", `{{localStorage.getItem("")}}`, true);
      agHelper.AssertText(locators._textInside, "text", "true");
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      agHelper.GetNClick(propPane._actionCardByTitle("Store value"));
      agHelper.GetNClick(propPane._actionSelectorDelete);
    });

    // Open bug present : https://github.com/appsmithorg/appsmith/issues/37671
    it.skip("5. To verify that calling storeValue() with a non-string key fails. The value should not be stored, and an error should be thrown due to an invalid key type.", () => {
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.SelectPlatformFunction("onClick", "Store value");
      agHelper.TypeText(propPane._actionSelectorFieldByLabel("Value"), "true");
      agHelper.GetNClick(propPane._actionSelectorPopupClose);
      agHelper.ClickButton("Submit");
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
      propPane.TypeTextIntoField("Text", `{{localStorage.getItem("")}}`, true);
      agHelper.ClickOutside();
      agHelper.ClickButton("Submit");
      agHelper.AssertText(locators._textInside, "text", "true");
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      agHelper.GetNClick(propPane._actionCardByTitle("Store value"));
      agHelper.GetNClick(propPane._actionSelectorDelete);
    });

    it("6. To verify if the value stored using storeValue() can be accessed through appsmith.store", () => {
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.SelectPlatformFunction("onClick", "Store value");
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("Key"),
        "booleanKey",
      );
      agHelper.TypeText(propPane._actionSelectorFieldByLabel("Value"), "true");
      agHelper.GetNClick(propPane._actionSelectorPopupClose);
      agHelper.ClickButton("Submit");
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
      propPane.TypeTextIntoField("Text", `{{appsmith.store.booleanKey}}`);
      agHelper.AssertText(locators._textInside, "text", "true");

      // Deploy verification for both key-value pairs
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.AssertText(locators._textInside, "text", "true");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);

      // JSObject verification for both key-value pairs
      const jsObjectBody = `export default {
          myFun1 () {
        {{appsmith.store.booleanKey}}
          },
        }`;

      jsEditor.CreateJSObject(jsObjectBody, {
        paste: true,
        completeReplace: true,
        toRun: false,
        prettify: false,
        shouldCreateNewJSObj: true,
      });
      agHelper.GetText(jsEditor._jsObjName).then((jsObjectName: string) => {
        cy.wrap(jsObjectName).as("jsObjectName");
      });

      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.ToggleJSMode("onClick", true);
      cy.get("@jsObjectName").then((jsObjectName: string) => {
        console.log("Mera variable: ", jsObjectName);
        propPane.EnterJSContext(
          "onClick",
          `{{${jsObjectName}.myFun1()}}`,
          true,
          false,
        );
      });
      agHelper.ClickButton("Submit");
      agHelper.AssertText(locators._textInside, "text", "true");
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.AssertText(locators._textInside, "text", "true");
      deployMode.NavigateBacktoEditor();

      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.ToggleJSMode("onClick", false);
      agHelper.GetNClick(propPane._actionCardByTitle("Execute a JS function"));
      agHelper.GetNClick(propPane._actionSelectorDelete);
    });

    it("7. To verify if multiple values can be stored at once using an object.", () => {
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.SelectPlatformFunction("onClick", "Store value");
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("Key"),
        "objectKey",
      );
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("Value"),
        JSON.stringify({ key1: "value1", key2: "value2" }),
      );
      agHelper.GetNClick(propPane._actionSelectorPopupClose);
      agHelper.ClickButton("Submit");

      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TEXT, 200, 700);
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
      propPane.TypeTextIntoField(
        "Text",
        `{{JSON.parse(localStorage.getItem("objectKey")).key1}}`,
      );
      agHelper.AssertText(locators._textInside, "text", "value1");

      EditorNavigation.SelectEntityByName("Text2", EntityType.Widget);
      propPane.TypeTextIntoField(
        "Text",
        `{{JSON.parse(localStorage.getItem("objectKey")).key2}}`,
      );
      agHelper.AssertText(locators._textInside, "text", "value2", 1);

      // Deploy verification for both key-value pairs
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.AssertText(locators._textInside, "text", "value1");
      agHelper.AssertText(locators._textInside, "text", "value2", 1);
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);

      // JSObject verification for both key-value pairs
      const jsObjectBody = `export default {
          myFun1 () {
        {{storeValue('objectKey', JSON.stringify({ key1: 'value1', key2: 'value2' }));}}
          },
        }`;

      jsEditor.CreateJSObject(jsObjectBody, {
        paste: true,
        completeReplace: true,
        toRun: false,
        prettify: false,
        shouldCreateNewJSObj: true,
      });
      agHelper.GetText(jsEditor._jsObjName).then((jsObjectName: string) => {
        cy.wrap(jsObjectName).as("jsObjectName");
      });

      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.ToggleJSMode("onClick", true);
      cy.get("@jsObjectName").then((jsObjectName: string) => {
        console.log("Mera variable: ", jsObjectName);
        propPane.EnterJSContext(
          "onClick",
          `{{${jsObjectName}.myFun1()}}`,
          true,
          false,
        );
      });
      agHelper.ClickButton("Submit");
      agHelper.AssertText(locators._textInside, "text", "value1");
      agHelper.AssertText(locators._textInside, "text", "value2", 1);
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.AssertText(locators._textInside, "text", "value1");
      agHelper.AssertText(locators._textInside, "text", "value2", 1);
      deployMode.NavigateBacktoEditor();

      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.ToggleJSMode("onClick", false);
      agHelper.GetNClick(propPane._actionCardByTitle("Execute a JS function"));
      agHelper.GetNClick(propPane._actionSelectorDelete);
    });
  },
);
