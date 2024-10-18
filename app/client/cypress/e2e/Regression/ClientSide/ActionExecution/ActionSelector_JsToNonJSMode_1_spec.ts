import {
  agHelper,
  apiPage,
  jsEditor,
  locators,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "JS to non-JS mode in Action Selector",
  { tags: ["@tag.JS", "@tag.Binding"] },
  () => {
    it("1. should not show any fields with a blank JS field", () => {
      agHelper.AddDsl("promisesBtnDsl", locators._buttonByText("Submit"));
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.EnterJSContext("onClick", `{{}}`, true, false);
      propPane.ToggleJSMode("onClick", false);
      agHelper.AssertElementAbsence(".action");
    });

    it("2. should show Api fields when Api1.run is entered", () => {
      apiPage.CreateApi("Api1");
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.EnterJSContext("onClick", `{{Api1.run()}}`, true, false);
      propPane.ToggleJSMode("onClick", false);
      agHelper.GetNAssertElementText(
        propPane._actionCard,
        "GETExecute a queryApi1.run",
      );
      propPane.SelectActionByTitleAndValue("Execute a query", "Api1.run");
      propPane.AssertSelectValue("Api1.run");
    });

    it("3. should show Api fields when an Api with then/catch is entered", () => {
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.EnterJSContext(
        "onClick",
        `{{Api1.run().then(() => {}).catch(() => {});}}`,
        true,
        false,
      );
      propPane.ToggleJSMode("onClick", false);
      agHelper.GetNAssertElementText(
        propPane._actionCard,
        "GETExecute a queryApi1.run",
      );
    });

    it("4. should show Api fields when an Api with then/catch is entered", () => {
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.EnterJSContext(
        "onClick",
        `{{Api1.run().then(() => { showAlert(); }).catch(() => { showModal(); });}}`,
        true,
        false,
      );
      propPane.ToggleJSMode("onClick", false);
      agHelper.GetNAssertElementText(
        propPane._actionCard,
        "GETExecute a queryApi1.run+2",
      );
      agHelper.GetNClick(propPane._actionCard);

      agHelper.GetNAssertElementText(
        propPane._actionCallbackTitle,
        "On success",
        "have.text",
        0,
      );
      agHelper.GetNAssertElementText(
        propPane._actionCard,
        "Show alertAdd message",
        "have.text",
        1,
      );
      agHelper.GetNAssertElementText(
        propPane._actionCallbackTitle,
        "On failure",
        "have.text",
        1,
      );
      agHelper.GetNAssertElementText(
        propPane._actionCard,
        "Show modalnone",
        "have.text",
        2,
      );
    });

    it("5. should show Api fields when an Api with then/catch is entered", () => {
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.EnterJSContext(
        "onClick",
        `{{Api1.run().then(() => { showAlert('Hello world!', 'info'); storeValue('a', 18); }).catch(() => { showModal(Modal1.name); });}}`,
        true,
        false,
      );
      propPane.ToggleJSMode("onClick", false);
      agHelper.GetNAssertElementText(
        propPane._actionCard,
        "GETExecute a queryApi1.run+3",
      );
      agHelper.GetNClick(propPane._actionCard);

      agHelper.GetNAssertElementText(
        propPane._actionCallbackTitle,
        "On success",
        "have.text",
        0,
      );
      agHelper.GetNAssertElementText(
        propPane._actionCard,
        "Show alertHello world!",
        "have.text",
        1,
      );
      agHelper.GetNAssertElementText(
        propPane._actionCallbackTitle,
        "On failure",
        "have.text",
        1,
      );
      agHelper.GetNAssertElementText(
        propPane._actionCard,
        "Store valuea",
        "have.text",
        2,
      );
      agHelper.GetNAssertElementText(
        propPane._actionCard,
        "Show modalModal1",
        "have.text",
        3,
      );

      agHelper.GetNClick(propPane._actionCard, 1);
      agHelper.ValidateCodeEditorContent(propPane._textView, "Hello world!");
      agHelper.GetNAssertElementText(propPane._selectorViewButton, "Info");

      agHelper.GetNClick(propPane._actionCard, 2);
      agHelper.ValidateCodeEditorContent(propPane._textView, "a{{18}}");

      agHelper.GetNClick(propPane._actionCard, 3);
      agHelper.GetNAssertElementText(
        propPane._selectorViewButton,
        "Select modal",
      );
    });

    it("6. should show Api related fields appropriately with platform functions with callbacks", () => {
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.EnterJSContext(
        "onClick",
        `{{Api1.run().then(() => {
    appsmith.geolocation.getCurrentPosition(location => {
    showAlert(location);
    });
  }).catch(() => {
    setInterval(() => {
      showAlert('hi');
    }, 5000, '1');
  });}}`,
        true,
        true,
      );
      propPane.ToggleJSMode("onClick", false);

      agHelper.GetNAssertElementText(
        propPane._actionCard,
        "GETExecute a queryApi1.run+2",
      );

      agHelper.GetNClick(propPane._actionCard);

      agHelper.GetNAssertElementText(
        propPane._actionCallbackTitle,
        "On success",
        "have.text",
        0,
      );
      agHelper.GetNAssertElementText(
        propPane._actionCallbackTitle,
        "On failure",
        "have.text",
        1,
      );
      agHelper.GetNAssertElementText(
        propPane._actionCard,
        "Set interval5000ms",
        "have.text",
        2,
      );
    });

    it("7. should show Api related fields appropriately with platform functions with catch callback", () => {
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.EnterJSContext(
        "onClick",
        "{{Api1.run().catch(() => copyToClipboard('hi'))}}",
        true,
        false,
      );
      propPane.ToggleJSMode("onClick", false);

      agHelper.GetNAssertElementText(
        propPane._actionCard,
        "GETExecute a queryApi1.run+1",
        "have.text",
        0,
      );

      agHelper.GetNClick(propPane._actionCard);

      agHelper.GetNAssertElementText(
        propPane._actionCallbackTitle,
        "On failure",
        "have.text",
        1,
      );
      agHelper.GetNAssertElementText(
        propPane._actionCard,
        "Copy to clipboardhi",
        "have.text",
        1,
      );

      agHelper.GetNClick(propPane._actionCard, 1);
      agHelper.ValidateCodeEditorContent(propPane._textView, "hi");
    });

    it("8. should show Api related fields appropriately with platform functions with catch callback", () => {
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.EnterJSContext(
        "onClick",
        "{{Api1.run().then(() => clearStore())}}",
        true,
        false,
      );
      propPane.ToggleJSMode("onClick", false);

      agHelper.GetNAssertElementText(
        propPane._actionCard,
        "GETExecute a queryApi1.run+1",
        "have.text",
        0,
      );

      agHelper.GetNClick(propPane._actionCard);

      agHelper.GetNAssertElementText(
        propPane._actionCallbackTitle,
        "On success",
        "have.text",
        0,
      );
      agHelper.GetNAssertElementText(
        propPane._actionCard,
        "Clear store",
        "have.text",
        1,
      );
    });

    it("9. shows fields appropriately for JS Object functions with/without arguments", () => {
      const JS_OBJECT_BODY = `export default {
      funcWithoutArgsSync: () => {
        console.log("hi");
      },
      funcWithArgsSync: (a,b) => {
        return a+b;
      },
      funcWithoutArgsAsync: async () => {
        await console.log("hi");
      },
      funcWithArgsAsync: async (a,b) => {
        await console.log(a+b);
      }
    }`;

      jsEditor.CreateJSObject(JS_OBJECT_BODY, {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
      });
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);

      propPane.EnterJSContext(
        "onClick",
        "{{JSObject1.funcWithoutArgsSync()}}",
        true,
        false,
      );
      propPane.ToggleJSMode("onClick", false);

      agHelper.GetNAssertElementText(
        propPane._actionCard,
        "Execute a JS functionJSObject1.funcWithoutArgsSync()",
        "have.text",
        0,
      );

      agHelper.GetNClick(propPane._actionCard);
      agHelper.AssertElementAbsence(propPane._actionPopupTextLabel, 0);

      propPane.EnterJSContext(
        "onClick",
        "{{JSObject1.funcWithArgsSync(18,26)}}",
        true,
        false,
      );
      propPane.ToggleJSMode("onClick", false);

      agHelper.GetNAssertElementText(
        propPane._actionCard,
        "Execute a JS functionJSObject1.funcWithArgsSync(18, 26)",
        "have.text",
        0,
      );

      agHelper.GetNClick(propPane._actionCard);
      agHelper.ValidateCodeEditorContent(propPane._textView, "{{18}}{{26}}");
      agHelper.GetNAssertElementText(
        propPane._actionPopupTextLabel,
        "a",
        "have.text",
        0,
      );
      agHelper.GetNAssertElementText(
        propPane._actionPopupTextLabel,
        "b",
        "have.text",
        1,
      );

      propPane.EnterJSContext(
        "onClick",
        "{{JSObject1.funcWithoutArgsAsync()}}",
        true,
        false,
      );
      propPane.ToggleJSMode("onClick", false);

      agHelper.GetNAssertElementText(
        propPane._actionCard,
        "Execute a JS functionJSObject1.funcWithoutArgsAsync()",
        "have.text",
        0,
      );

      agHelper.GetNClick(propPane._actionCard, 0);
      agHelper.AssertElementAbsence(propPane._actionPopupTextLabel, 0);

      propPane.EnterJSContext(
        "onClick",
        "{{JSObject1.funcWithArgsAsync()}}",
        true,
        false,
      );
      propPane.ToggleJSMode("onClick", false);

      agHelper.GetNAssertElementText(
        propPane._actionCard,
        "Execute a JS functionJSObject1.funcWithArgsAsync()",
        "have.text",
        0,
      );

      agHelper.GetNClick(propPane._actionCard, 0);
      agHelper.GetNAssertElementText(
        propPane._actionPopupTextLabel,
        "a",
        "have.text",
        0,
      );
      agHelper.GetNAssertElementText(
        propPane._actionPopupTextLabel,
        "b",
        "have.text",
        1,
      );
    });

    it("10. shows fields appropriately for JS Object functions with/without arguments and then/catch blocks", () => {
      const JS_OBJECT_BODY = `export default {
      promiseFuncNoArgs: () => {
        return new Promise((resolve) => {
            resolve("hi");
          });
      },
       promiseFuncWithArgs: (a) => {
        return new Promise((resolve, reject) => {
            if (a === "hi") {
              resolve("hi");
            } else {
              reject("bye");
            }
          });
      },
    }`;

      jsEditor.CreateJSObject(JS_OBJECT_BODY, {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
      });
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);

      propPane.EnterJSContext(
        "onClick",
        '{{JSObject2.promiseFuncNoArgs().then(() => showAlert("then"))}}',
        true,
        false,
      );
      propPane.ToggleJSMode("onClick", false);

      agHelper.GetNAssertElementText(
        propPane._actionCard,
        "Execute a JS functionJSObject2.promiseFuncNoArgs()",
        "have.text",
        0,
      );

      agHelper.GetNClick(propPane._actionCard, 0);
      agHelper.AssertElementAbsence(propPane._actionPopupTextLabel, 0);

      propPane.EnterJSContext(
        "onClick",
        '{{JSObject2.promiseFuncNoArgs().catch(() => showAlert("catch"))}}',
        true,
        false,
      );
      propPane.ToggleJSMode("onClick", false);

      agHelper.GetNAssertElementText(
        propPane._actionCard,
        "Execute a JS functionJSObject2.promiseFuncNoArgs()",
        "have.text",
        0,
      );

      agHelper.GetNClick(propPane._actionCard, 0);
      agHelper.AssertElementAbsence(propPane._actionPopupTextLabel, 0);

      propPane.EnterJSContext(
        "onClick",
        '{{JSObject2.promiseFuncNoArgs().then(() => showAlert("then")).catch(() => showAlert("catch"));}}',
        true,
        false,
      );
      propPane.ToggleJSMode("onClick", false);

      agHelper.GetNAssertElementText(
        propPane._actionCard,
        "Execute a JS functionJSObject2.promiseFuncNoArgs()",
        "have.text",
        0,
      );

      agHelper.GetNClick(propPane._actionCard, 0);
      agHelper.AssertElementAbsence(propPane._actionPopupTextLabel, 0);

      propPane.EnterJSContext(
        "onClick",
        '{{JSObject2.promiseFuncNoArgs().catch(() => showAlert("catch")).then(() => showAlert("then"));}}',
        true,
        false,
      );
      propPane.ToggleJSMode("onClick", false);

      agHelper.GetNAssertElementText(
        propPane._actionCard,
        "Execute a JS functionJSObject2.promiseFuncNoArgs()",
        "have.text",
        0,
      );

      agHelper.GetNClick(propPane._actionCard, 0);
      agHelper.AssertElementAbsence(propPane._actionPopupTextLabel, 0);

      propPane.EnterJSContext(
        "onClick",
        '{{JSObject2.promiseFuncWithArgs("hi").then(() => showAlert("hi")).catch(() => showAlert("bye"));}}',
        true,
        false,
      );
      propPane.ToggleJSMode("onClick", false);

      agHelper.GetNAssertElementText(
        propPane._actionCard,
        'Execute a JS functionJSObject2.promiseFuncWithArgs("hi")',
        "have.text",
        0,
      );

      agHelper.GetNClick(propPane._actionCard, 0);
      agHelper.GetNAssertElementText(
        propPane._actionPopupTextLabel,
        "a",
        "have.text",
        0,
      );
      agHelper.ValidateCodeEditorContent(propPane._textView, "hi");

      propPane.EnterJSContext(
        "onClick",
        '{{JSObject2.promiseFuncWithArgs().catch(() => showAlert("catch"));}}',
        true,
        false,
      );
      propPane.ToggleJSMode("onClick", false);

      agHelper.GetNAssertElementText(
        propPane._actionCard,
        "Execute a JS functionJSObject2.promiseFuncWithArgs()",
        "have.text",
        0,
      );

      agHelper.GetNClick(propPane._actionCard, 0);
      agHelper.GetNAssertElementText(
        propPane._actionPopupTextLabel,
        "a",
        "have.text",
        0,
      );

      propPane.EnterJSContext(
        "onClick",
        '{{JSObject2.promiseFuncWithArgs().then(() => showAlert("hi")).catch(() => showAlert("bye"));}}',
        true,
        false,
      );
      propPane.ToggleJSMode("onClick", false);

      agHelper.GetNAssertElementText(
        propPane._actionCard,
        "Execute a JS functionJSObject2.promiseFuncWithArgs()",
        "have.text",
        0,
      );

      agHelper.GetNClick(propPane._actionCard, 0);
      agHelper.GetNAssertElementText(
        propPane._actionPopupTextLabel,
        "a",
        "have.text",
        0,
      );
    });
  },
);
