import * as _ from "../../../../support/Objects/ObjectsCore";

describe("JS to non-JS mode in Action Selector", () => {
  it("1. should not show any fields with a blank JS field", () => {
    cy.fixture("promisesBtnDsl").then((val: any) => {
      _.agHelper.AddDsl(val, _.locators._spanButton("Submit"));
    });
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");
    _.propPane.EnterJSContext("onClick", `{{}}`, true, false);
    _.propPane.ToggleJSMode("onClick", false);
    _.agHelper.AssertElementAbsence(".action");
  });

  it("2. should show Api fields when Api1.run is entered", () => {
    _.apiPage.CreateApi("Api1");
    _.entityExplorer.SelectEntityByName("Page1", "Pages");
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");
    _.propPane.EnterJSContext("onClick", `{{Api1.run()}}`, true, false);
    _.propPane.ToggleJSMode("onClick", false);
    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "GETExecute a queryApi1.run",
    );
    _.propPane.SelectActionByTitleAndValue("Execute a query", "Api1.run");
    _.agHelper.Sleep(200);
    _.propPane.AssertSelectValue("Api1.run");
  });

  it("3. should show Api fields when an Api with then/catch is entered", () => {
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");
    _.propPane.EnterJSContext(
      "onClick",
      `{{Api1.run().then(() => {}).catch(() => {});}}`,
      true,
      false,
    );
    _.propPane.ToggleJSMode("onClick", false);
    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "GETExecute a queryApi1.run",
    );
  });

  it("4. should show Api fields when an Api with then/catch is entered", () => {
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");
    _.propPane.EnterJSContext(
      "onClick",
      `{{Api1.run().then(() => { showAlert(); }).catch(() => { showModal(); });}}`,
      true,
      false,
    );
    _.propPane.ToggleJSMode("onClick", false);
    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "GETExecute a queryApi1.run+2",
    );
    _.agHelper.GetNClick(_.propPane._actionCard);
    _.agHelper.GetNClick(_.propPane._actionTreeCollapse);
    _.agHelper.GetNAssertElementText(
      _.propPane._actionCallbackTitle,
      "On success",
      "have.text",
      0,
    );
    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Show alertAdd message",
      "have.text",
      1,
    );
    _.agHelper.GetNAssertElementText(
      _.propPane._actionCallbackTitle,
      "On failure",
      "have.text",
      1,
    );
    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Show modalnone",
      "have.text",
      2,
    );
  });

  it("5. should show Api fields when an Api with then/catch is entered", () => {
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");
    _.propPane.EnterJSContext(
      "onClick",
      `{{Api1.run().then(() => { showAlert('Hello world!', 'info'); storeValue('a', 18); }).catch(() => { showModal('Modal1'); });}}`,
      true,
      false,
    );
    _.propPane.ToggleJSMode("onClick", false);
    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "GETExecute a queryApi1.run+3",
    );
    _.agHelper.GetNClick(_.propPane._actionCard);
    _.agHelper.GetNClick(_.propPane._actionTreeCollapse);
    _.agHelper.GetNAssertElementText(
      _.propPane._actionCallbackTitle,
      "On success",
      "have.text",
      0,
    );
    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Show alertHello world!",
      "have.text",
      1,
    );
    _.agHelper.GetNAssertElementText(
      _.propPane._actionCallbackTitle,
      "On failure",
      "have.text",
      1,
    );
    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Store valuea",
      "have.text",
      2,
    );
    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Show modalModal1",
      "have.text",
      3,
    );

    _.agHelper.GetNClick(_.propPane._actionCard, 1);
    _.agHelper.ValidateCodeEditorContent(_.propPane._textView, "Hello world!");
    _.agHelper.GetNAssertElementText(_.propPane._selectorViewButton, "Info");

    _.agHelper.GetNClick(_.propPane._actionCard, 2);
    _.agHelper.ValidateCodeEditorContent(_.propPane._textView, "a{{18}}");

    _.agHelper.GetNClick(_.propPane._actionCard, 3);
    _.agHelper.GetNAssertElementText(
      _.propPane._selectorViewButton,
      "Select modal",
    );
  });

  it("6. should show Api related fields appropriately with platform functions with callbacks", () => {
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");
    _.propPane.EnterJSContext(
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
    _.propPane.ToggleJSMode("onClick", false);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "GETExecute a queryApi1.run+2",
    );

    _.agHelper.GetNClick(_.propPane._actionCard);
    _.agHelper.GetNClick(_.propPane._actionTreeCollapse);
    _.agHelper.GetNAssertElementText(
      _.propPane._actionCallbackTitle,
      "On success",
      "have.text",
      0,
    );
    _.agHelper.GetNAssertElementText(
      _.propPane._actionCallbackTitle,
      "On failure",
      "have.text",
      1,
    );
    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Set interval5000ms",
      "have.text",
      2,
    );
  });

  it("7. should show Api related fields appropriately with platform functions with catch callback", () => {
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");
    _.propPane.EnterJSContext(
      "onClick",
      "{{Api1.run().catch(() => copyToClipboard('hi'))}}",
      true,
      false,
    );
    _.propPane.ToggleJSMode("onClick", false);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "GETExecute a queryApi1.run+1",
      "have.text",
      0,
    );

    _.agHelper.GetNClick(_.propPane._actionCard);
    _.agHelper.GetNClick(_.propPane._actionTreeCollapse);
    _.agHelper.GetNAssertElementText(
      _.propPane._actionCallbackTitle,
      "On failure",
      "have.text",
      1,
    );
    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Copy to clipboardhi",
      "have.text",
      1,
    );

    _.agHelper.GetNClick(_.propPane._actionCard, 1);
    _.agHelper.ValidateCodeEditorContent(_.propPane._textView, "hi");
  });

  it("8. should show Api related fields appropriately with platform functions with catch callback", () => {
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");
    _.propPane.EnterJSContext(
      "onClick",
      "{{Api1.run().then(() => clearStore())}}",
      true,
      false,
    );
    _.propPane.ToggleJSMode("onClick", false);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "GETExecute a queryApi1.run+1",
      "have.text",
      0,
    );

    _.agHelper.GetNClick(_.propPane._actionCard);
    _.agHelper.GetNClick(_.propPane._actionTreeCollapse);
    _.agHelper.GetNAssertElementText(
      _.propPane._actionCallbackTitle,
      "On success",
      "have.text",
      0,
    );
    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Clear store",
      "have.text",
      1,
    );
  });

  it("9. shows fields appropriately for JS object functions with/without arguments", () => {
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

    _.jsEditor.CreateJSObject(JS_OBJECT_BODY, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });
    _.entityExplorer.SelectEntityByName("Page1", "Pages");
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");

    _.propPane.EnterJSContext(
      "onClick",
      "{{JSObject1.funcWithoutArgsSync()}}",
      true,
      false,
    );
    _.propPane.ToggleJSMode("onClick", false);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Execute a JS functionJSObject1.funcWithoutArgsSync()",
      "have.text",
      0,
    );

    _.agHelper.GetNClick(_.propPane._actionCard, 0);
    _.agHelper.AssertElementAbsence(_.propPane._actionPopupTextLabel, 0);

    _.propPane.EnterJSContext(
      "onClick",
      "{{JSObject1.funcWithArgsSync(18,26)}}",
      true,
      false,
    );
    _.propPane.ToggleJSMode("onClick", false);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Execute a JS functionJSObject1.funcWithArgsSync(18, 26)",
      "have.text",
      0,
    );

    _.agHelper.GetNClick(_.propPane._actionCard, 0);
    _.agHelper.ValidateCodeEditorContent(_.propPane._textView, "{{18}}{{26}}");
    _.agHelper.GetNAssertElementText(
      _.propPane._actionPopupTextLabel,
      "a",
      "have.text",
      0,
    );
    _.agHelper.GetNAssertElementText(
      _.propPane._actionPopupTextLabel,
      "b",
      "have.text",
      1,
    );

    _.propPane.EnterJSContext(
      "onClick",
      "{{JSObject1.funcWithoutArgsAsync()}}",
      true,
      false,
    );
    _.propPane.ToggleJSMode("onClick", false);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Execute a JS functionJSObject1.funcWithoutArgsAsync()",
      "have.text",
      0,
    );

    _.agHelper.GetNClick(_.propPane._actionCard, 0);
    _.agHelper.AssertElementAbsence(_.propPane._actionPopupTextLabel, 0);

    _.propPane.EnterJSContext(
      "onClick",
      "{{JSObject1.funcWithArgsAsync()}}",
      true,
      false,
    );
    _.propPane.ToggleJSMode("onClick", false);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Execute a JS functionJSObject1.funcWithArgsAsync()",
      "have.text",
      0,
    );

    _.agHelper.GetNClick(_.propPane._actionCard, 0);
    _.agHelper.GetNAssertElementText(
      _.propPane._actionPopupTextLabel,
      "a",
      "have.text",
      0,
    );
    _.agHelper.GetNAssertElementText(
      _.propPane._actionPopupTextLabel,
      "b",
      "have.text",
      1,
    );
  });

  it("10. shows fields appropriately for JS object functions with/without arguments and then/catch blocks", () => {
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

    _.jsEditor.CreateJSObject(JS_OBJECT_BODY, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });
    _.entityExplorer.SelectEntityByName("Page1", "Pages");
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");

    _.propPane.EnterJSContext(
      "onClick",
      '{{JSObject2.promiseFuncNoArgs().then(() => showAlert("then"))}}',
      true,
      false,
    );
    _.propPane.ToggleJSMode("onClick", false);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Execute a JS functionJSObject2.promiseFuncNoArgs()",
      "have.text",
      0,
    );

    _.agHelper.GetNClick(_.propPane._actionCard, 0);
    _.agHelper.AssertElementAbsence(_.propPane._actionPopupTextLabel, 0);

    _.propPane.EnterJSContext(
      "onClick",
      '{{JSObject2.promiseFuncNoArgs().catch(() => showAlert("catch"))}}',
      true,
      false,
    );
    _.propPane.ToggleJSMode("onClick", false);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Execute a JS functionJSObject2.promiseFuncNoArgs()",
      "have.text",
      0,
    );

    _.agHelper.GetNClick(_.propPane._actionCard, 0);
    _.agHelper.AssertElementAbsence(_.propPane._actionPopupTextLabel, 0);

    _.propPane.EnterJSContext(
      "onClick",
      '{{JSObject2.promiseFuncNoArgs().then(() => showAlert("then")).catch(() => showAlert("catch"));}}',
      true,
      false,
    );
    _.propPane.ToggleJSMode("onClick", false);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Execute a JS functionJSObject2.promiseFuncNoArgs()",
      "have.text",
      0,
    );

    _.agHelper.GetNClick(_.propPane._actionCard, 0);
    _.agHelper.AssertElementAbsence(_.propPane._actionPopupTextLabel, 0);

    _.propPane.EnterJSContext(
      "onClick",
      '{{JSObject2.promiseFuncNoArgs().catch(() => showAlert("catch")).then(() => showAlert("then"));}}',
      true,
      false,
    );
    _.propPane.ToggleJSMode("onClick", false);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Execute a JS functionJSObject2.promiseFuncNoArgs()",
      "have.text",
      0,
    );

    _.agHelper.GetNClick(_.propPane._actionCard, 0);
    _.agHelper.AssertElementAbsence(_.propPane._actionPopupTextLabel, 0);

    _.propPane.EnterJSContext(
      "onClick",
      '{{JSObject2.promiseFuncWithArgs("hi").then(() => showAlert("hi")).catch(() => showAlert("bye"));}}',
      true,
      false,
    );
    _.propPane.ToggleJSMode("onClick", false);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      'Execute a JS functionJSObject2.promiseFuncWithArgs("hi")',
      "have.text",
      0,
    );

    _.agHelper.GetNClick(_.propPane._actionCard, 0);
    _.agHelper.GetNAssertElementText(
      _.propPane._actionPopupTextLabel,
      "a",
      "have.text",
      0,
    );
    _.agHelper.ValidateCodeEditorContent(_.propPane._textView, "hi");

    _.propPane.EnterJSContext(
      "onClick",
      '{{JSObject2.promiseFuncWithArgs().catch(() => showAlert("catch"));}}',
      true,
      false,
    );
    _.propPane.ToggleJSMode("onClick", false);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Execute a JS functionJSObject2.promiseFuncWithArgs()",
      "have.text",
      0,
    );

    _.agHelper.GetNClick(_.propPane._actionCard, 0);
    _.agHelper.GetNAssertElementText(
      _.propPane._actionPopupTextLabel,
      "a",
      "have.text",
      0,
    );

    _.propPane.EnterJSContext(
      "onClick",
      '{{JSObject2.promiseFuncWithArgs().then(() => showAlert("hi")).catch(() => showAlert("bye"));}}',
      true,
      false,
    );
    _.propPane.ToggleJSMode("onClick", false);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Execute a JS functionJSObject2.promiseFuncWithArgs()",
      "have.text",
      0,
    );

    _.agHelper.GetNClick(_.propPane._actionCard, 0);
    _.agHelper.GetNAssertElementText(
      _.propPane._actionPopupTextLabel,
      "a",
      "have.text",
      0,
    );
  });

  it("11. shows fields for navigate to from js to non-js mode", () => {
    _.entityExplorer.SelectEntityByName("Page1", "Pages");
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");

    _.propPane.EnterJSContext("onClick", "{{navigateTo()}}", true, false);
    _.propPane.ToggleJSMode("onClick", false);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Navigate toSelect page",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.agHelper.AssertElementVisible(_.propPane._navigateToType("Page name"));

    _.agHelper.GetNAssertElementText(
      _.propPane._actionOpenDropdownSelectPage,
      "Select page",
      "have.text",
      0,
    );

    _.agHelper.GetNAssertElementText(
      _.propPane._actionPopupTextLabel,
      "Query params",
      "have.text",
      0,
    );

    _.agHelper.GetNAssertElementText(
      _.propPane._sameWindowDropdownOption,
      "Same window",
      "have.text",
      0,
    );

    _.propPane.EnterJSContext(
      "onClick",
      "{{navigateTo('Page1', {a:1}, 'NEW_WINDOW')}}",
      true,
      true,
    );
    _.propPane.ToggleJSMode("onClick", false);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Navigate toPage1",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.agHelper.AssertElementVisible(_.propPane._navigateToType("Page name"));

    _.agHelper.GetNAssertElementText(
      _.propPane._actionOpenDropdownSelectPage,
      "Page1",
      "have.text",
      0,
    );

    _.agHelper.GetNAssertElementText(
      _.propPane._actionPopupTextLabel,
      "Query params",
      "have.text",
      0,
    );

    _.agHelper.GetNAssertElementText(
      _.propPane._sameWindowDropdownOption,
      "New window",
      "have.text",
      0,
    );

    _.propPane.EnterJSContext(
      "onClick",
      "{{navigateTo('google.com', {a:1}, 'SAME_WINDOW')}}",
      true,
      true,
    );
    _.propPane.ToggleJSMode("onClick", false);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Navigate togoogle.com",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.agHelper.AssertElementVisible(_.propPane._navigateToType("URL"));

    _.agHelper.GetNAssertElementText(
      _.propPane._actionPopupTextLabel,
      "Enter URL",
      "have.text",
      0,
    );

    _.agHelper.GetNAssertElementText(
      _.propPane._actionPopupTextLabel,
      "Query params",
      "have.text",
      1,
    );

    _.agHelper.GetNAssertElementText(
      _.propPane._sameWindowDropdownOption,
      "Same window",
      "have.text",
      0,
    );
  });

  it("12. shows fields for show alert from js to non-js mode", () => {
    _.entityExplorer.SelectEntityByName("Page1", "Pages");
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");

    _.propPane.EnterJSContext("onClick", "{{showAlert()}}", true, false);
    _.propPane.ToggleJSMode("onClick", false);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Show alertAdd message",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionPopupTextLabel,
      "Message",
      "have.text",
      0,
    );

    _.agHelper.GetNAssertElementText(
      _.propPane._dropdownSelectType,
      "Select type",
      "have.text",
      0,
    );

    _.propPane.EnterJSContext(
      "onClick",
      "{{showAlert('hello', 'info')}}",
      true,
      false,
    );
    _.propPane.ToggleJSMode("onClick", false);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Show alerthello",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionPopupTextLabel,
      "Message",
      "have.text",
      0,
    );
    _.agHelper.ValidateCodeEditorContent(_.propPane._textView, "hello");

    _.agHelper.GetNAssertElementText(
      _.propPane._dropdownSelectType,
      "Info",
      "have.text",
      0,
    );
  });

  it("13. shows fields for show modal from js to non-js mode", () => {
    _.entityExplorer.SelectEntityByName("Page1", "Pages");

    _.entityExplorer.DragDropWidgetNVerify("modalwidget", 50, 50);
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");

    _.propPane.EnterJSContext("onClick", "{{showModal()}}", true, false);
    _.propPane.ToggleJSMode("onClick", false);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Show modalnone",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionOpenDropdownSelectModal,
      "Select modal",
      "have.text",
      0,
    );

    _.propPane.EnterJSContext(
      "onClick",
      "{{showModal('Modal1')}}",
      true,
      false,
    );
    _.propPane.ToggleJSMode("onClick", false);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Show modalModal1",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionOpenDropdownSelectModal,
      "Modal1",
      "have.text",
      0,
    );
  });

  it("14. shows fields for remove modal from js to non-js mode", () => {
    _.entityExplorer.SelectEntityByName("Page1", "Pages");
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");

    _.propPane.EnterJSContext("onClick", "{{closeModal()}}", true, false);
    _.propPane.ToggleJSMode("onClick", false);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Close modalnone",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionOpenDropdownSelectModal,
      "Select modal",
      "have.text",
      0,
    );

    _.propPane.EnterJSContext(
      "onClick",
      "{{closeModal('Modal1')}}",
      true,
      false,
    );
    _.propPane.ToggleJSMode("onClick", false);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Close modalModal1",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionOpenDropdownSelectModal,
      "Modal1",
      "have.text",
      0,
    );
  });

  it("15. should shows appropriate fields for store value", () => {
    _.entityExplorer.SelectEntityByName("Page1", "Pages");
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");

    _.propPane.EnterJSContext("onClick", "{{storeValue()}}", true, false);
    _.propPane.ToggleJSMode("onClick", false);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Store valueAdd key",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionPopupTextLabel,
      "Key",
      "have.text",
      0,
    );
    _.agHelper.GetNAssertElementText(
      _.propPane._actionPopupTextLabel,
      "Value",
      "have.text",
      1,
    );

    _.propPane.EnterJSContext(
      "onClick",
      "{{storeValue('a', '')}}",
      true,
      false,
    );
    _.propPane.ToggleJSMode("onClick", false);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Store valuea",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.propPane.EnterJSContext("onClick", "{{storeValue('a', 1)}}", true, false);
    _.propPane.ToggleJSMode("onClick", false);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Store valuea",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.agHelper.ValidateCodeEditorContent(_.propPane._textView, "a{{1}}");

    _.propPane.EnterJSContext("onClick", "{{storeValue('', 1)}}", true, false);
    _.propPane.ToggleJSMode("onClick", false);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Store valueAdd key",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);
  });

  it("16. shows fields for remove value appropriately", () => {
    _.entityExplorer.SelectEntityByName("Page1", "Pages");
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");

    _.propPane.EnterJSContext("onClick", "{{removeValue()}}", true, false);
    _.propPane.ToggleJSMode("onClick", false);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Remove valueAdd key",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionPopupTextLabel,
      "Key",
      "have.text",
      0,
    );

    _.propPane.EnterJSContext("onClick", "{{removeValue('a')}}", true, false);
    _.propPane.ToggleJSMode("onClick", false);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Remove valuea",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.agHelper.ValidateCodeEditorContent(_.propPane._textView, "a");
  });

  it("17. shows fields appropriately for the download function", () => {
    _.entityExplorer.SelectEntityByName("Page1", "Pages");
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");

    _.propPane.EnterJSContext("onClick", "{{download()}}", true, false);
    _.propPane.ToggleJSMode("onClick", false);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "DownloadAdd data to download",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionPopupTextLabel,
      "Data to download",
      "have.text",
      0,
    );
    _.agHelper.GetNAssertElementText(
      _.propPane._actionPopupTextLabel,
      "File name with extension",
      "have.text",
      1,
    );
    _.agHelper.GetNAssertElementText(
      _.propPane._selectorViewLabel,
      "Type",
      "have.text",
      0,
    );

    _.agHelper.GetNAssertElementText(
      _.propPane._selectorViewButton,
      "Select file type (optional)",
    );

    _.propPane.EnterJSContext(
      "onClick",
      "{{download('a', '', '')}}",
      true,
      false,
    );
    _.propPane.ToggleJSMode("onClick", false);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "DownloadAdd data to download",
      "have.text",
      0,
    );

    _.propPane.EnterJSContext(
      "onClick",
      "{{download('a', 'b', '')}}",
      true,
      false,
    );
    _.propPane.ToggleJSMode("onClick", false);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Downloadb",
      "have.text",
      0,
    );

    _.propPane.EnterJSContext(
      "onClick",
      "{{download('a', 'b', 'image/png')}}",
      true,
      false,
    );
    _.propPane.ToggleJSMode("onClick", false);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Downloadb",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);
    _.agHelper.ValidateCodeEditorContent(_.propPane._textView, "ab");

    _.agHelper.GetNAssertElementText(
      _.propPane._selectorViewButton,
      "PNG",
      "have.text",
      0,
    );
  });

  it("18. shows fields for copyToClipboard appropriately", () => {
    _.entityExplorer.SelectEntityByName("Page1", "Pages");
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");

    _.propPane.EnterJSContext("onClick", "{{copyToClipboard()}}", true, false);
    _.propPane.ToggleJSMode("onClick", false);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Copy to clipboardAdd text",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionPopupTextLabel,
      "Text to be copied to clipboard",
      "have.text",
      0,
    );

    _.propPane.EnterJSContext(
      "onClick",
      "{{copyToClipboard('a')}}",
      true,
      false,
    );
    _.propPane.ToggleJSMode("onClick", false);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Copy to clipboarda",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.agHelper.ValidateCodeEditorContent(_.propPane._textView, "a");
    _.agHelper.TypeText(
      _.propPane._actionSelectorFieldByLabel("Text to be copied to clipboard"),
      "line1{enter}line2{enter}line3",
      0,
      true,
    );
    _.propPane.ToggleJSMode("onClick");
    _.propPane.ValidatePropertyFieldValue(
      "onClick",
      `{{copyToClipboard('line1\\nline2\\nline3a');}}`,
    );
  });

  it("19. shows fields for reset widget appropriately", () => {
    _.entityExplorer.SelectEntityByName("Page1", "Pages");
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");

    _.propPane.EnterJSContext("onClick", "{{resetWidget()}}", true, false);
    _.propPane.ToggleJSMode("onClick", false);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Reset widgetSelect widget",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.agHelper.GetNAssertElementText(
      _.propPane._selectorViewLabel,
      "Widget",
      "have.text",
      0,
    );

    _.agHelper.GetNAssertElementText(
      _.propPane._selectorViewLabel,
      "Reset Children",
      "have.text",
      1,
    );

    _.agHelper.GetNAssertElementText(
      _.propPane._selectorViewButton,
      "Select widget",
      "have.text",
      0,
    );

    _.agHelper.GetNAssertElementText(
      _.propPane._selectorViewButton,
      "true",
      "have.text",
      1,
    );

    _.propPane.EnterJSContext(
      "onClick",
      '{{resetWidget("Modal1", false)}}',
      true,
      false,
    );
    _.propPane.ToggleJSMode("onClick", false);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Reset widgetModal1",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.agHelper.GetNAssertElementText(
      _.propPane._selectorViewButton,
      "Modal1",
      "have.text",
      0,
    );

    _.agHelper.GetNAssertElementText(
      _.propPane._selectorViewButton,
      "false",
      "have.text",
      1,
    );

    _.propPane.EnterJSContext(
      "onClick",
      '{{resetWidget("Modal1")}}',
      true,
      false,
    );
    _.propPane.ToggleJSMode("onClick", false);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Reset widgetModal1",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.agHelper.GetNAssertElementText(
      _.propPane._selectorViewButton,
      "Modal1",
      "have.text",
      0,
    );

    _.agHelper.GetNAssertElementText(
      _.propPane._selectorViewButton,
      "true",
      "have.text",
      1,
    );

    _.propPane.EnterJSContext(
      "onClick",
      "{{resetWidget('', false)}}",
      true,
      false,
    );
    _.propPane.ToggleJSMode("onClick", false);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Reset widgetSelect widget",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.agHelper.GetNAssertElementText(
      _.propPane._selectorViewButton,
      "Select widget",
      "have.text",
      0,
    );

    _.agHelper.GetNAssertElementText(
      _.propPane._selectorViewButton,
      "false",
      "have.text",
      1,
    );
  });

  it("20. should show fields appropriately for setinterval", () => {
    _.entityExplorer.SelectEntityByName("Page1", "Pages");
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");

    _.propPane.EnterJSContext("onClick", "{{setInterval()}}", true, false);
    _.propPane.ToggleJSMode("onClick", false);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Set intervalms",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionPopupTextLabel,
      "Callback function",
      "have.text",
      0,
    );

    _.agHelper.GetNAssertElementText(
      _.propPane._actionPopupTextLabel,
      "Delay (ms)",
      "have.text",
      1,
    );

    _.agHelper.GetNAssertElementText(
      _.propPane._actionPopupTextLabel,
      "Id",
      "have.text",
      2,
    );

    _.propPane.EnterJSContext(
      "onClick",
      "{{setInterval(() => {}, 200, '')}}",
      true,
      false,
    );
    _.propPane.ToggleJSMode("onClick", false);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Set interval200ms",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.propPane.EnterJSContext(
      "onClick",
      "{{setInterval(() => {showAlert('hi')}, 200, 'id1')}}",
      true,
      false,
    );
    _.propPane.ToggleJSMode("onClick", false);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Set interval200ms",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);
  });

  it("21. should show fields appropriately for clearInterval", () => {
    _.entityExplorer.SelectEntityByName("Page1", "Pages");
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");

    _.propPane.EnterJSContext("onClick", "{{clearInterval()}}", true, false);
    _.propPane.ToggleJSMode("onClick", false);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Clear intervalAdd Id",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionPopupTextLabel,
      "Id",
      "have.text",
      0,
    );

    _.propPane.EnterJSContext(
      "onClick",
      "{{clearInterval('Id1')}}",
      true,
      true,
    );
    _.propPane.ToggleJSMode("onClick", false);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Clear intervalId1",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.agHelper.ValidateCodeEditorContent(_.propPane._textView, "Id1");
  });

  it("22. should show no fields for clear store", () => {
    _.entityExplorer.SelectEntityByName("Page1", "Pages");
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");

    _.propPane.EnterJSContext("onClick", "{{clearStore()}}", true, false);
    _.propPane.ToggleJSMode("onClick", false);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Clear store",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.agHelper.AssertElementAbsence(_.propPane._textView);
    _.agHelper.AssertElementAbsence(_.propPane._selectorView);
  });

  it("23. should show no fields for watch geolocation position", () => {
    _.entityExplorer.SelectEntityByName("Page1", "Pages");
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");

    _.propPane.EnterJSContext(
      "onClick",
      "{{appsmith.geolocation.watchPosition()}}",
      true,
      false,
    );
    _.propPane.ToggleJSMode("onClick", false);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Watch geolocation",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.agHelper.AssertElementAbsence(_.propPane._textView);
    _.agHelper.AssertElementAbsence(_.propPane._selectorView);
  });

  it("24. should show no fields for stop watching geolocation position", () => {
    _.entityExplorer.SelectEntityByName("Page1", "Pages");
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");

    _.propPane.EnterJSContext(
      "onClick",
      "{{appsmith.geolocation.clearWatch()}}",
      true,
      false,
    );
    _.propPane.ToggleJSMode("onClick", false);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Stop watching geolocation",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.agHelper.AssertElementAbsence(_.propPane._textView);
    _.agHelper.AssertElementAbsence(_.propPane._selectorView);
  });

  it("25. should show appropriate fields for get geolocation", () => {
    _.entityExplorer.SelectEntityByName("Page1", "Pages");
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");

    _.propPane.EnterJSContext(
      "onClick",
      "{{appsmith.geolocation.getCurrentPosition()}}",
      true,
      false,
    );
    _.propPane.ToggleJSMode("onClick", false);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Get geolocationAdd callback",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionPopupTextLabel,
      "Callback function",
      "have.text",
      0,
    );

    _.propPane.EnterJSContext(
      "onClick",
      `{{appsmith.geolocation.getCurrentPosition((location) => {
      // add code here
    });}}`,
      true,
      true,
    );
    _.propPane.ToggleJSMode("onClick", false);

    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionPopupTextLabel,
      "Callback function",
      "have.text",
      0,
    );
  });

  it("26. should show post message fields appropriately", () => {
    _.entityExplorer.SelectEntityByName("Page1", "Pages");
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");

    _.propPane.EnterJSContext(
      "onClick",
      "{{postWindowMessage()}}",
      true,
      false,
    );
    _.propPane.ToggleJSMode("onClick", false);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Post messageAdd message",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionPopupTextLabel,
      "Message",
      "have.text",
      0,
    );
    _.agHelper.GetNAssertElementText(
      _.propPane._actionPopupTextLabel,
      "Target iframe",
      "have.text",
      1,
    );
    _.agHelper.GetNAssertElementText(
      _.propPane._actionPopupTextLabel,
      "Allowed origins",
      "have.text",
      2,
    );

    _.propPane.EnterJSContext(
      "onClick",
      "{{postWindowMessage('hello', 'window', '*')}}",
      true,
      false,
    );
    _.propPane.ToggleJSMode("onClick", false);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Post messagehello",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.agHelper.ValidateCodeEditorContent(_.propPane._textView, "hellowindow*");
  });
});
