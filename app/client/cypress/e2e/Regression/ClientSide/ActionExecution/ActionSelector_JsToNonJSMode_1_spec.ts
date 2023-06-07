import * as _ from "../../../../support/Objects/ObjectsCore";

describe("JS to non-JS mode in Action Selector", () => {
  it("1. should not show any fields with a blank JS field", () => {
    cy.fixture("promisesBtnDsl").then((val: any) => {
      _.agHelper.AddDsl(val, _.locators._spanButton("Submit"));
    });
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");
    _.propPane.EnterJSContext("onClick", `{{}}`, true, false);
    _.jsEditor.DisableJSContext("onClick");
    _.agHelper.AssertElementAbsence(".action");
  });

  it("2. should show Api fields when Api1.run is entered", () => {
    _.apiPage.CreateApi("Api1");
    _.entityExplorer.SelectEntityByName("Page1", "Pages");
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");
    _.propPane.EnterJSContext("onClick", `{{Api1.run()}}`, true, false);
    _.jsEditor.DisableJSContext("onClick");
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
    _.jsEditor.DisableJSContext("onClick");
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
    _.jsEditor.DisableJSContext("onClick");
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
    _.jsEditor.DisableJSContext("onClick");
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
    _.jsEditor.DisableJSContext("onClick");

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
    _.jsEditor.DisableJSContext("onClick");

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
    _.jsEditor.DisableJSContext("onClick");

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
    _.jsEditor.DisableJSContext("onClick");

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
    _.jsEditor.DisableJSContext("onClick");

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
    _.jsEditor.DisableJSContext("onClick");

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
    _.jsEditor.DisableJSContext("onClick");

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
    _.jsEditor.DisableJSContext("onClick");

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
    _.jsEditor.DisableJSContext("onClick");

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
    _.jsEditor.DisableJSContext("onClick");

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
    _.jsEditor.DisableJSContext("onClick");

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
    _.jsEditor.DisableJSContext("onClick");

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
    _.jsEditor.DisableJSContext("onClick");

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
    _.jsEditor.DisableJSContext("onClick");

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
});
