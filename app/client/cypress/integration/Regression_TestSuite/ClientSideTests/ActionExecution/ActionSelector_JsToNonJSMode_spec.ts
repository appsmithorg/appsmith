import { ObjectsRegistry } from "../../../../support/Objects/Registry";
const {
  AggregateHelper: agHelper,
  ApiPage: apiPage,
  CommonLocators: locator,
  EntityExplorer: ee,
  JSEditor: jsEditor,
  PropertyPane: propPane,
} = ObjectsRegistry;

describe("JS to non-JS mode in Action Selector", () => {
  it("should not show any fields with a blank JS field", () => {
    cy.fixture("promisesBtnDsl").then((val: any) => {
      agHelper.AddDsl(val, locator._spanButton("Submit"));
    });
    ee.SelectEntityByName("Button1", "Widgets");
    propPane.EnterJSContext("onClick", `{{}}`, true, false);
    jsEditor.DisableJSContext("onClick");
    agHelper.AssertElementAbsence(".action");
  });

  it("should show Api fields when Api1.run is entered", () => {
    apiPage.CreateApi("Api1");
    ee.SelectEntityByName("Page1", "Pages");
    ee.SelectEntityByName("Button1", "Widgets");
    propPane.EnterJSContext("onClick", `{{Api1.run()}}`, true, false);
    jsEditor.DisableJSContext("onClick");
    agHelper.GetNAssertElementText(
      ".action-block-tree",
      "GETExecute a queryApi1.run",
    );
  });

  it("should show Api fields when an Api with then/catch is entered", () => {
    ee.SelectEntityByName("Button1", "Widgets");
    propPane.EnterJSContext(
      "onClick",
      `{{Api1.run().then(() => {}).catch(() => {});}}`,
      true,
      false,
    );
    jsEditor.DisableJSContext("onClick");
    agHelper.GetNAssertElementText(
      ".action-block-tree",
      "GETExecute a queryApi1.run",
    );
  });

  it("should show Api fields when an Api with then/catch is entered", () => {
    ee.SelectEntityByName("Button1", "Widgets");
    propPane.EnterJSContext(
      "onClick",
      `{{Api1.run().then(() => { showAlert(); }).catch(() => { showModal(); });}}`,
      true,
      false,
    );
    jsEditor.DisableJSContext("onClick");
    agHelper.GetNAssertElementText(
      ".action-block-tree",
      "GETExecute a queryApi1.run+2",
    );
    agHelper.GetNClick(".action-block-tree");
    agHelper.GetNClick(".callback-collapse");
    agHelper.GetNAssertElementText(
      ".action-callback-add",
      "On success",
      "have.text",
      0,
    );
    agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Show AlertAdd message",
      "have.text",
      1,
    );
    agHelper.GetNAssertElementText(
      ".action-callback-add",
      "On failure",
      "have.text",
      1,
    );
    agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Show modalnone",
      "have.text",
      2,
    );
  });

  it("should show Api fields when an Api with then/catch is entered", () => {
    ee.SelectEntityByName("Button1", "Widgets");
    propPane.EnterJSContext(
      "onClick",
      `{{Api1.run().then(() => { showAlert('Hello world!', 'info'); storeValue('a', 18); }).catch(() => { showModal('Modal1'); });}}`,
      true,
      false,
    );
    jsEditor.DisableJSContext("onClick");
    agHelper.GetNAssertElementText(
      ".action-block-tree",
      "GETExecute a queryApi1.run+3",
    );
    agHelper.GetNClick(".action-block-tree");
    agHelper.GetNClick(".callback-collapse");
    agHelper.GetNAssertElementText(
      ".action-callback-add",
      "On success",
      "have.text",
      0,
    );
    agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Show AlertHello world!",
      "have.text",
      1,
    );
    agHelper.GetNAssertElementText(
      ".action-callback-add",
      "On failure",
      "have.text",
      1,
    );
    agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Store valuea",
      "have.text",
      2,
    );
    agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Show modalModal1",
      "have.text",
      3,
    );

    agHelper.GetNClick(".action-block-tree", 1);
    agHelper.ValidateCodeEditorContent(".text-view", "Hello world!");
    agHelper.GetNAssertElementText(".selector-view .bp3-button-text", "Info");

    agHelper.GetNClick(".action-block-tree", 2);
    agHelper.ValidateCodeEditorContent(".text-view", "a{{18}}");

    agHelper.GetNClick(".action-block-tree", 3);
    agHelper.GetNAssertElementText(
      ".selector-view .bp3-button-text",
      "Select Modal",
    );
  });

  it("should show Api related fields appropriately with platform functions with callbacks", () => {
    ee.SelectEntityByName("Button1", "Widgets");
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
    jsEditor.DisableJSContext("onClick");

    agHelper.GetNAssertElementText(
      ".action-block-tree",
      "GETExecute a queryApi1.run+2",
    );

    agHelper.GetNClick(".action-block-tree");
    agHelper.GetNClick(".callback-collapse");
    agHelper.GetNAssertElementText(
      ".action-callback-add",
      "On success",
      "have.text",
      0,
    );
    agHelper.GetNAssertElementText(
      ".action-callback-add",
      "On failure",
      "have.text",
      1,
    );
    agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Set interval5000ms",
      "have.text",
      2,
    );
  });

  it("should show Api related fields appropriately with platform functions with catch callback", () => {
    ee.SelectEntityByName("Button1", "Widgets");
    propPane.EnterJSContext(
      "onClick",
      "{{Api1.run().catch(() => copyToClipboard('hi'))}}",
      true,
      false,
    );
    jsEditor.DisableJSContext("onClick");

    agHelper.GetNAssertElementText(
      ".action-block-tree",
      "GETExecute a queryApi1.run+1",
      "have.text",
      0,
    );

    agHelper.GetNClick(".action-block-tree");
    agHelper.GetNClick(".callback-collapse");
    agHelper.GetNAssertElementText(
      ".action-callback-add",
      "On failure",
      "have.text",
      1,
    );
    agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Copy to clipboardhi",
      "have.text",
      1,
    );

    agHelper.GetNClick(".action-block-tree", 1);
    agHelper.ValidateCodeEditorContent(".text-view", "hi");
  });

  it("should show Api related fields appropriately with platform functions with catch callback", () => {
    ee.SelectEntityByName("Button1", "Widgets");
    propPane.EnterJSContext(
      "onClick",
      "{{Api1.run().then(() => clearStore())}}",
      true,
      false,
    );
    jsEditor.DisableJSContext("onClick");

    agHelper.GetNAssertElementText(
      ".action-block-tree",
      "GETExecute a queryApi1.run+1",
      "have.text",
      0,
    );

    agHelper.GetNClick(".action-block-tree");
    agHelper.GetNClick(".callback-collapse");
    agHelper.GetNAssertElementText(
      ".action-callback-add",
      "On success",
      "have.text",
      0,
    );
    agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Clear store",
      "have.text",
      1,
    );
  });

  it("shows fields appropriately for JS object functions with/without arguments", () => {
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
    ee.SelectEntityByName("Page1", "Pages");
    ee.SelectEntityByName("Button1", "Widgets");

    propPane.EnterJSContext(
      "onClick",
      "{{JSObject1.funcWithoutArgsSync()}}",
      true,
      false,
    );
    jsEditor.DisableJSContext("onClick");

    agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Execute a JS functionJSObject1.funcWithoutArgsSync()",
      "have.text",
      0,
    );

    agHelper.GetNClick(".action-block-tree", 0);
    agHelper.AssertElementAbsence('[data-testId="text-view-label"]', 0);

    propPane.EnterJSContext(
      "onClick",
      "{{JSObject1.funcWithArgsSync(18,26)}}",
      true,
      false,
    );
    jsEditor.DisableJSContext("onClick");

    agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Execute a JS functionJSObject1.funcWithArgsSync(18, 26)",
      "have.text",
      0,
    );

    agHelper.GetNClick(".action-block-tree", 0);
    agHelper.ValidateCodeEditorContent(".text-view", "{{18}}{{26}}");
    agHelper.GetNAssertElementText(
      '[data-testId="text-view-label"]',
      "a",
      "have.text",
      0,
    );
    agHelper.GetNAssertElementText(
      '[data-testId="text-view-label"]',
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
    jsEditor.DisableJSContext("onClick");

    agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Execute a JS functionJSObject1.funcWithoutArgsAsync()",
      "have.text",
      0,
    );

    agHelper.GetNClick(".action-block-tree", 0);
    agHelper.AssertElementAbsence('[data-testId="text-view-label"]', 0);

    propPane.EnterJSContext(
      "onClick",
      "{{JSObject1.funcWithArgsAsync()}}",
      true,
      false,
    );
    jsEditor.DisableJSContext("onClick");

    agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Execute a JS functionJSObject1.funcWithArgsAsync()",
      "have.text",
      0,
    );

    agHelper.GetNClick(".action-block-tree", 0);
    agHelper.GetNAssertElementText(
      '[data-testId="text-view-label"]',
      "a",
      "have.text",
      0,
    );
    agHelper.GetNAssertElementText(
      '[data-testId="text-view-label"]',
      "b",
      "have.text",
      1,
    );
  });

  it("shows fields appropriately for JS object functions with/without arguments and then/catch blocks", () => {
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
    ee.SelectEntityByName("Page1", "Pages");
    ee.SelectEntityByName("Button1", "Widgets");

    propPane.EnterJSContext(
      "onClick",
      '{{JSObject2.promiseFuncNoArgs().then(() => showAlert("then"))}}',
      true,
      false,
    );
    jsEditor.DisableJSContext("onClick");

    agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Execute a JS functionJSObject2.promiseFuncNoArgs()",
      "have.text",
      0,
    );

    agHelper.GetNClick(".action-block-tree", 0);
    agHelper.AssertElementAbsence('[data-testId="text-view-label"]', 0);

    propPane.EnterJSContext(
      "onClick",
      '{{JSObject2.promiseFuncNoArgs().catch(() => showAlert("catch"))}}',
      true,
      false,
    );
    jsEditor.DisableJSContext("onClick");

    agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Execute a JS functionJSObject2.promiseFuncNoArgs()",
      "have.text",
      0,
    );

    agHelper.GetNClick(".action-block-tree", 0);
    agHelper.AssertElementAbsence('[data-testId="text-view-label"]', 0);

    propPane.EnterJSContext(
      "onClick",
      '{{JSObject2.promiseFuncNoArgs().then(() => showAlert("then")).catch(() => showAlert("catch"));}}',
      true,
      false,
    );
    jsEditor.DisableJSContext("onClick");

    agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Execute a JS functionJSObject2.promiseFuncNoArgs()",
      "have.text",
      0,
    );

    agHelper.GetNClick(".action-block-tree", 0);
    agHelper.AssertElementAbsence('[data-testId="text-view-label"]', 0);

    propPane.EnterJSContext(
      "onClick",
      '{{JSObject2.promiseFuncNoArgs().catch(() => showAlert("catch")).then(() => showAlert("then"));}}',
      true,
      false,
    );
    jsEditor.DisableJSContext("onClick");

    agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Execute a JS functionJSObject2.promiseFuncNoArgs()",
      "have.text",
      0,
    );

    agHelper.GetNClick(".action-block-tree", 0);
    agHelper.AssertElementAbsence('[data-testId="text-view-label"]', 0);

    propPane.EnterJSContext(
      "onClick",
      '{{JSObject2.promiseFuncWithArgs("hi").then(() => showAlert("hi")).catch(() => showAlert("bye"));}}',
      true,
      false,
    );
    jsEditor.DisableJSContext("onClick");

    agHelper.GetNAssertElementText(
      ".action-block-tree",
      'Execute a JS functionJSObject2.promiseFuncWithArgs("hi")',
      "have.text",
      0,
    );

    agHelper.GetNClick(".action-block-tree", 0);
    agHelper.GetNAssertElementText(
      '[data-testId="text-view-label"]',
      "a",
      "have.text",
      0,
    );
    agHelper.ValidateCodeEditorContent(".text-view", "hi");

    propPane.EnterJSContext(
      "onClick",
      '{{JSObject2.promiseFuncWithArgs().catch(() => showAlert("catch"));}}',
      true,
      false,
    );
    jsEditor.DisableJSContext("onClick");

    agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Execute a JS functionJSObject2.promiseFuncWithArgs()",
      "have.text",
      0,
    );

    agHelper.GetNClick(".action-block-tree", 0);
    agHelper.GetNAssertElementText(
      '[data-testId="text-view-label"]',
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
    jsEditor.DisableJSContext("onClick");

    agHelper.GetNAssertElementText(
      ".action-block-tree",
      "Execute a JS functionJSObject2.promiseFuncWithArgs()",
      "have.text",
      0,
    );

    agHelper.GetNClick(".action-block-tree", 0);
    agHelper.GetNAssertElementText(
      '[data-testId="text-view-label"]',
      "a",
      "have.text",
      0,
    );
  });
});
