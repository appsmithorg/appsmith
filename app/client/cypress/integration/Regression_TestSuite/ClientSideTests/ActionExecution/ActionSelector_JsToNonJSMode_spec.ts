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
      ".action-block-tree",
      "GETExecute a queryApi1.run",
    );
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
      ".action-block-tree",
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
      ".action-block-tree",
      "GETExecute a queryApi1.run+2",
    );
    _.agHelper.GetNClick(".action-block-tree");
    _.agHelper.GetNClick(".callback-collapse");
    _.agHelper.GetNAssertElementText(
      ".action-callback-add",
      "On success",
      "have.text",
      0,
    );
    _.agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Show AlertAdd message",
      "have.text",
      1,
    );
    _.agHelper.GetNAssertElementText(
      ".action-callback-add",
      "On failure",
      "have.text",
      1,
    );
    _.agHelper.GetNAssertElementText(
      ".action-block-tree",
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
      ".action-block-tree",
      "GETExecute a queryApi1.run+3",
    );
    _.agHelper.GetNClick(".action-block-tree");
    _.agHelper.GetNClick(".callback-collapse");
    _.agHelper.GetNAssertElementText(
      ".action-callback-add",
      "On success",
      "have.text",
      0,
    );
    _.agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Show AlertHello world!",
      "have.text",
      1,
    );
    _.agHelper.GetNAssertElementText(
      ".action-callback-add",
      "On failure",
      "have.text",
      1,
    );
    _.agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Store valuea",
      "have.text",
      2,
    );
    _.agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Show modalModal1",
      "have.text",
      3,
    );

    _.agHelper.GetNClick(".action-block-tree", 1);
    _.agHelper.ValidateCodeEditorContent(".text-view", "Hello world!");
    _.agHelper.GetNAssertElementText(".selector-view .bp3-button-text", "Info");

    _.agHelper.GetNClick(".action-block-tree", 2);
    _.agHelper.ValidateCodeEditorContent(".text-view", "a{{18}}");

    _.agHelper.GetNClick(".action-block-tree", 3);
    _.agHelper.GetNAssertElementText(
      ".selector-view .bp3-button-text",
      "Select Modal",
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
      ".action-block-tree",
      "GETExecute a queryApi1.run+2",
    );

    _.agHelper.GetNClick(".action-block-tree");
    _.agHelper.GetNClick(".callback-collapse");
    _.agHelper.GetNAssertElementText(
      ".action-callback-add",
      "On success",
      "have.text",
      0,
    );
    _.agHelper.GetNAssertElementText(
      ".action-callback-add",
      "On failure",
      "have.text",
      1,
    );
    _.agHelper.GetNAssertElementText(
      ".action-block-tree",
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
      ".action-block-tree",
      "GETExecute a queryApi1.run+1",
      "have.text",
      0,
    );

    _.agHelper.GetNClick(".action-block-tree");
    _.agHelper.GetNClick(".callback-collapse");
    _.agHelper.GetNAssertElementText(
      ".action-callback-add",
      "On failure",
      "have.text",
      1,
    );
    _.agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Copy to clipboardhi",
      "have.text",
      1,
    );

    _.agHelper.GetNClick(".action-block-tree", 1);
    _.agHelper.ValidateCodeEditorContent(".text-view", "hi");
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
      ".action-block-tree",
      "GETExecute a queryApi1.run+1",
      "have.text",
      0,
    );

    _.agHelper.GetNClick(".action-block-tree");
    _.agHelper.GetNClick(".callback-collapse");
    _.agHelper.GetNAssertElementText(
      ".action-callback-add",
      "On success",
      "have.text",
      0,
    );
    _.agHelper.GetNAssertElementText(
      ".action-block-tree",
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
      ".action-block-tree",
      "Execute a JS functionJSObject1.funcWithoutArgsSync()",
      "have.text",
      0,
    );

    _.agHelper.GetNClick(".action-block-tree", 0);
    _.agHelper.AssertElementAbsence('[data-testId="text-view-label"]', 0);

    _.propPane.EnterJSContext(
      "onClick",
      "{{JSObject1.funcWithArgsSync(18,26)}}",
      true,
      false,
    );
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Execute a JS functionJSObject1.funcWithArgsSync(18, 26)",
      "have.text",
      0,
    );

    _.agHelper.GetNClick(".action-block-tree", 0);
    _.agHelper.ValidateCodeEditorContent(".text-view", "{{18}}{{26}}");
    _.agHelper.GetNAssertElementText(
      '[data-testId="text-view-label"]',
      "a",
      "have.text",
      0,
    );
    _.agHelper.GetNAssertElementText(
      '[data-testId="text-view-label"]',
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
      ".action-block-tree",
      "Execute a JS functionJSObject1.funcWithoutArgsAsync()",
      "have.text",
      0,
    );

    _.agHelper.GetNClick(".action-block-tree", 0);
    _.agHelper.AssertElementAbsence('[data-testId="text-view-label"]', 0);

    _.propPane.EnterJSContext(
      "onClick",
      "{{JSObject1.funcWithArgsAsync()}}",
      true,
      false,
    );
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Execute a JS functionJSObject1.funcWithArgsAsync()",
      "have.text",
      0,
    );

    _.agHelper.GetNClick(".action-block-tree", 0);
    _.agHelper.GetNAssertElementText(
      '[data-testId="text-view-label"]',
      "a",
      "have.text",
      0,
    );
    _.agHelper.GetNAssertElementText(
      '[data-testId="text-view-label"]',
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
      ".action-block-tree",
      "Execute a JS functionJSObject2.promiseFuncNoArgs()",
      "have.text",
      0,
    );

    _.agHelper.GetNClick(".action-block-tree", 0);
    _.agHelper.AssertElementAbsence('[data-testId="text-view-label"]', 0);

    _.propPane.EnterJSContext(
      "onClick",
      '{{JSObject2.promiseFuncNoArgs().catch(() => showAlert("catch"))}}',
      true,
      false,
    );
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Execute a JS functionJSObject2.promiseFuncNoArgs()",
      "have.text",
      0,
    );

    _.agHelper.GetNClick(".action-block-tree", 0);
    _.agHelper.AssertElementAbsence('[data-testId="text-view-label"]', 0);

    _.propPane.EnterJSContext(
      "onClick",
      '{{JSObject2.promiseFuncNoArgs().then(() => showAlert("then")).catch(() => showAlert("catch"));}}',
      true,
      false,
    );
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Execute a JS functionJSObject2.promiseFuncNoArgs()",
      "have.text",
      0,
    );

    _.agHelper.GetNClick(".action-block-tree", 0);
    _.agHelper.AssertElementAbsence('[data-testId="text-view-label"]', 0);

    _.propPane.EnterJSContext(
      "onClick",
      '{{JSObject2.promiseFuncNoArgs().catch(() => showAlert("catch")).then(() => showAlert("then"));}}',
      true,
      false,
    );
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Execute a JS functionJSObject2.promiseFuncNoArgs()",
      "have.text",
      0,
    );

    _.agHelper.GetNClick(".action-block-tree", 0);
    _.agHelper.AssertElementAbsence('[data-testId="text-view-label"]', 0);

    _.propPane.EnterJSContext(
      "onClick",
      '{{JSObject2.promiseFuncWithArgs("hi").then(() => showAlert("hi")).catch(() => showAlert("bye"));}}',
      true,
      false,
    );
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      ".action-block-tree",
      'Execute a JS functionJSObject2.promiseFuncWithArgs("hi")',
      "have.text",
      0,
    );

    _.agHelper.GetNClick(".action-block-tree", 0);
    _.agHelper.GetNAssertElementText(
      '[data-testId="text-view-label"]',
      "a",
      "have.text",
      0,
    );
    _.agHelper.ValidateCodeEditorContent(".text-view", "hi");

    _.propPane.EnterJSContext(
      "onClick",
      '{{JSObject2.promiseFuncWithArgs().catch(() => showAlert("catch"));}}',
      true,
      false,
    );
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Execute a JS functionJSObject2.promiseFuncWithArgs()",
      "have.text",
      0,
    );

    _.agHelper.GetNClick(".action-block-tree", 0);
    _.agHelper.GetNAssertElementText(
      '[data-testId="text-view-label"]',
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
      ".action-block-tree",
      "Execute a JS functionJSObject2.promiseFuncWithArgs()",
      "have.text",
      0,
    );

    _.agHelper.GetNClick(".action-block-tree", 0);
    _.agHelper.GetNAssertElementText(
      '[data-testId="text-view-label"]',
      "a",
      "have.text",
      0,
    );
  });

  it("11. shows fields for navigate to from js to non-js mode", () => {
    _.entityExplorer.SelectEntityByName("Page1", "Pages");
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");

    _.propPane.EnterJSContext("onClick", "{{navigateTo()}}", true, false);
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Navigate toSelect page",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(".action-block-tree", 0);

    _.agHelper.GetNAssertElementText(
      "#switcher--page-name",
      "Page Name",
      "have.text",
      0,
    );

    _.agHelper.GetNAssertElementText(
      ".t--open-dropdown-Select-Page",
      "Select Page",
      "have.text",
      0,
    );

    _.agHelper.GetNAssertElementText(
      '[data-testId="text-view-label"]',
      "Query Params",
      "have.text",
      0,
    );

    _.agHelper.GetNAssertElementText(
      ".t--open-dropdown-Same-window",
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
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Navigate toPage1",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(".action-block-tree", 0);

    _.agHelper.GetNAssertElementText(
      "#switcher--page-name",
      "Page Name",
      "have.text",
      0,
    );

    _.agHelper.GetNAssertElementText(
      ".t--open-dropdown-Select-Page",
      "Page1",
      "have.text",
      0,
    );

    _.agHelper.GetNAssertElementText(
      '[data-testId="text-view-label"]',
      "Query Params",
      "have.text",
      0,
    );

    _.agHelper.GetNAssertElementText(
      ".t--open-dropdown-Same-window",
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
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Navigate togoogle.com",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(".action-block-tree", 0);

    _.agHelper.GetNAssertElementText("#switcher--url", "URL", "have.text", 0);

    _.agHelper.GetNAssertElementText(
      '[data-testId="text-view-label"]',
      "Enter URL",
      "have.text",
      0,
    );

    _.agHelper.GetNAssertElementText(
      '[data-testId="text-view-label"]',
      "Query Params",
      "have.text",
      1,
    );

    _.agHelper.GetNAssertElementText(
      ".t--open-dropdown-Same-window",
      "Same window",
      "have.text",
      0,
    );
  });

  it("12. shows fields for show alert from js to non-js mode", () => {
    _.entityExplorer.SelectEntityByName("Page1", "Pages");
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");

    _.propPane.EnterJSContext("onClick", "{{showAlert()}}", true, false);
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Show AlertAdd message",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(".action-block-tree", 0);

    _.agHelper.GetNAssertElementText(
      '[data-testId="text-view-label"]',
      "Message",
      "have.text",
      0,
    );

    _.agHelper.GetNAssertElementText(
      ".t--open-dropdown-Select-type",
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
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Show Alerthello",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(".action-block-tree", 0);

    _.agHelper.GetNAssertElementText(
      '[data-testId="text-view-label"]',
      "Message",
      "have.text",
      0,
    );
    _.agHelper.ValidateCodeEditorContent(".text-view", "hello");

    _.agHelper.GetNAssertElementText(
      ".t--open-dropdown-Select-type",
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
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Show modalnone",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(".action-block-tree", 0);

    _.agHelper.GetNAssertElementText(
      ".t--open-dropdown-Select-Modal",
      "Select Modal",
      "have.text",
      0,
    );

    _.propPane.EnterJSContext(
      "onClick",
      "{{showModal('Modal1')}}",
      true,
      false,
    );
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Show modalModal1",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(".action-block-tree", 0);

    _.agHelper.GetNAssertElementText(
      ".t--open-dropdown-Select-Modal",
      "Modal1",
      "have.text",
      0,
    );
  });

  it("14. shows fields for remove modal from js to non-js mode", () => {
    _.entityExplorer.SelectEntityByName("Page1", "Pages");
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");

    _.propPane.EnterJSContext("onClick", "{{closeModal()}}", true, false);
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Close modalnone",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(".action-block-tree", 0);

    _.agHelper.GetNAssertElementText(
      ".t--open-dropdown-Select-Modal",
      "Select Modal",
      "have.text",
      0,
    );

    _.propPane.EnterJSContext(
      "onClick",
      "{{closeModal('Modal1')}}",
      true,
      false,
    );
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Close modalModal1",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(".action-block-tree", 0);

    _.agHelper.GetNAssertElementText(
      ".t--open-dropdown-Select-Modal",
      "Modal1",
      "have.text",
      0,
    );
  });

  it("15. should shows appropriate fields for store value", () => {
    _.entityExplorer.SelectEntityByName("Page1", "Pages");
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");

    _.propPane.EnterJSContext("onClick", "{{storeValue()}}", true, false);
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Store valueAdd key",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(".action-block-tree", 0);

    _.agHelper.GetNAssertElementText(
      '[data-testId="text-view-label"]',
      "Key",
      "have.text",
      0,
    );
    _.agHelper.GetNAssertElementText(
      '[data-testId="text-view-label"]',
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
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Store valuea",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(".action-block-tree", 0);

    _.propPane.EnterJSContext("onClick", "{{storeValue('a', 1)}}", true, false);
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Store valuea",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(".action-block-tree", 0);

    _.agHelper.ValidateCodeEditorContent(".text-view", "a{{1}}");

    _.propPane.EnterJSContext("onClick", "{{storeValue('', 1)}}", true, false);
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Store valueAdd key",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(".action-block-tree", 0);
  });

  it("16. shows fields for remove value appropriately", () => {
    _.entityExplorer.SelectEntityByName("Page1", "Pages");
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");

    _.propPane.EnterJSContext("onClick", "{{removeValue()}}", true, false);
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Remove valueAdd Key",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(".action-block-tree", 0);

    _.agHelper.GetNAssertElementText(
      '[data-testId="text-view-label"]',
      "Key",
      "have.text",
      0,
    );

    _.propPane.EnterJSContext("onClick", "{{removeValue('a')}}", true, false);
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Remove valuea",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(".action-block-tree", 0);

    _.agHelper.ValidateCodeEditorContent(".text-view", "a");
  });

  it("17. shows fields appropriately for the download function", () => {
    _.entityExplorer.SelectEntityByName("Page1", "Pages");
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");

    _.propPane.EnterJSContext("onClick", "{{download()}}", true, false);
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      ".action-block-tree",
      "DownloadAdd data to download",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(".action-block-tree", 0);

    _.agHelper.GetNAssertElementText(
      '[data-testId="text-view-label"]',
      "Data to download",
      "have.text",
      0,
    );
    _.agHelper.GetNAssertElementText(
      '[data-testId="text-view-label"]',
      "File name with extension",
      "have.text",
      1,
    );
    _.agHelper.GetNAssertElementText(
      '[data-testId="selector-view-label"]',
      "Type",
      "have.text",
      0,
    );

    _.agHelper.GetNAssertElementText(
      ".selector-view .bp3-button-text",
      "Select file type (optional)",
    );

    _.propPane.EnterJSContext(
      "onClick",
      "{{download('a', '', '')}}",
      true,
      false,
    );
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      ".action-block-tree",
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
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      ".action-block-tree",
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
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Downloadb",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(".action-block-tree", 0);
    _.agHelper.ValidateCodeEditorContent(".text-view", "ab");

    _.agHelper.GetNAssertElementText(
      ".selector-view .bp3-button-text",
      "PNG",
      "have.text",
      0,
    );
  });

  it("18. shows fields for copyToClipboard appropriately", () => {
    _.entityExplorer.SelectEntityByName("Page1", "Pages");
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");

    _.propPane.EnterJSContext("onClick", "{{copyToClipboard()}}", true, false);
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Copy to clipboardAdd text",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(".action-block-tree", 0);

    _.agHelper.GetNAssertElementText(
      '[data-testId="text-view-label"]',
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
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Copy to clipboarda",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(".action-block-tree", 0);

    _.agHelper.ValidateCodeEditorContent(".text-view", "a");
    _.agHelper.EnterActionValue(
      "Text to be copied to clipboard",
      "line1{enter}line2{enter}line3",
      false,
      0,
      true,
    );
    _.jsEditor.EnableJSContext("onClick");
    _.propPane.ValidatePropertyFieldValue(
      "onClick",
      `{{copyToClipboard('line1\\nline2\\nline3');}}`,
    );
  });

  it("19. shows fields for reset widget appropriately", () => {
    _.entityExplorer.SelectEntityByName("Page1", "Pages");
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");

    _.propPane.EnterJSContext("onClick", "{{resetWidget()}}", true, false);
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Reset widgetSelect widget",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(".action-block-tree", 0);

    _.agHelper.GetNAssertElementText(
      '[data-testId="selector-view-label"]',
      "Widget",
      "have.text",
      0,
    );

    _.agHelper.GetNAssertElementText(
      '[data-testId="selector-view-label"]',
      "Reset Children",
      "have.text",
      1,
    );

    _.agHelper.GetNAssertElementText(
      ".selector-view .bp3-button-text",
      "Select Widget",
      "have.text",
      0,
    );

    _.agHelper.GetNAssertElementText(
      ".selector-view .bp3-button-text",
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
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Reset widgetModal1",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(".action-block-tree", 0);

    _.agHelper.GetNAssertElementText(
      ".selector-view .bp3-button-text",
      "Modal1",
      "have.text",
      0,
    );

    _.agHelper.GetNAssertElementText(
      ".selector-view .bp3-button-text",
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
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Reset widgetModal1",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(".action-block-tree", 0);

    _.agHelper.GetNAssertElementText(
      ".selector-view .bp3-button-text",
      "Modal1",
      "have.text",
      0,
    );

    _.agHelper.GetNAssertElementText(
      ".selector-view .bp3-button-text",
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
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Reset widgetSelect widget",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(".action-block-tree", 0);

    _.agHelper.GetNAssertElementText(
      ".selector-view .bp3-button-text",
      "Select Widget",
      "have.text",
      0,
    );

    _.agHelper.GetNAssertElementText(
      ".selector-view .bp3-button-text",
      "false",
      "have.text",
      1,
    );
  });

  it("20. should show fields appropriately for setinterval", () => {
    _.entityExplorer.SelectEntityByName("Page1", "Pages");
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");

    _.propPane.EnterJSContext("onClick", "{{setInterval()}}", true, false);
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Set intervalms",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(".action-block-tree", 0);

    _.agHelper.GetNAssertElementText(
      '[data-testId="text-view-label"]',
      "Callback function",
      "have.text",
      0,
    );

    _.agHelper.GetNAssertElementText(
      '[data-testId="text-view-label"]',
      "Delay (ms)",
      "have.text",
      1,
    );

    _.agHelper.GetNAssertElementText(
      '[data-testId="text-view-label"]',
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
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Set interval200ms",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(".action-block-tree", 0);

    // _.agHelper.ValidateCodeEditorContent(".text-view", "{{() => {}}}{{200}}");

    _.propPane.EnterJSContext(
      "onClick",
      "{{setInterval(() => {showAlert('hi')}, 200, 'id1')}}",
      true,
      false,
    );
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Set interval200ms",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(".action-block-tree", 0);

    // _.agHelper.ValidateCodeEditorContent(".text-view", "{{() => {}}}{{200}}id1");
  });

  it("21. should show fields appropriately for clearInterval", () => {
    _.entityExplorer.SelectEntityByName("Page1", "Pages");
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");

    _.propPane.EnterJSContext("onClick", "{{clearInterval()}}", true, false);
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Clear intervalAdd ID",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(".action-block-tree", 0);

    _.agHelper.GetNAssertElementText(
      '[data-testId="text-view-label"]',
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
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Clear intervalId1",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(".action-block-tree", 0);

    _.agHelper.ValidateCodeEditorContent(".text-view", "Id1");
  });

  it("22. should show no fields for clear store", () => {
    _.entityExplorer.SelectEntityByName("Page1", "Pages");
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");

    _.propPane.EnterJSContext("onClick", "{{clearStore()}}", true, false);
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Clear store",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(".action-block-tree", 0);

    _.agHelper.AssertElementAbsence(".text-view");
    _.agHelper.AssertElementAbsence(".selector-view");
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
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Watch Geolocation",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(".action-block-tree", 0);

    _.agHelper.AssertElementAbsence(".text-view");
    _.agHelper.AssertElementAbsence(".selector-view");
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
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Stop watching Geolocation",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(".action-block-tree", 0);

    _.agHelper.AssertElementAbsence(".text-view");
    _.agHelper.AssertElementAbsence(".selector-view");
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
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Get GeolocationAdd callback",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(".action-block-tree", 0);

    _.agHelper.GetNAssertElementText(
      '[data-testId="text-view-label"]',
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
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNClick(".action-block-tree", 0);

    _.agHelper.GetNAssertElementText(
      '[data-testId="text-view-label"]',
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
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Post messageAdd message",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(".action-block-tree", 0);

    _.agHelper.GetNAssertElementText(
      '[data-testId="text-view-label"]',
      "Message",
      "have.text",
      0,
    );
    _.agHelper.GetNAssertElementText(
      '[data-testId="text-view-label"]',
      "Target iframe",
      "have.text",
      1,
    );
    _.agHelper.GetNAssertElementText(
      '[data-testId="text-view-label"]',
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
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Post messagehello",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(".action-block-tree", 0);

    _.agHelper.ValidateCodeEditorContent(".text-view", "hellowindow*");
  });
});
