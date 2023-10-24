import {
  agHelper,
  fakerHelper,
  draggableWidgets,
  entityExplorer,
  deployMode,
  propPane,
  apiPage,
  jsEditor,
  dataManager,
  locators,
  assertHelper,
} from "../../../../../support/Objects/ObjectsCore";

import clocators from "../../../../../locators/commonlocators.json";

describe("Button widget testcases", () => {
  before(() => {
    apiPage.CreateAndFillApi(
      dataManager.dsValues[dataManager.defaultEnviorment].mockApiUrl,
    );
  });

  it("1. On Click Button - execute a query ", () => {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON);
    const codeToSet = `export default {
        async run() {
        const res = await Api1.run();
        showAlert(\`Total record returned: \${res.length}\`);
    }}`;
    propPane.EnterJSContext("onClick", "{{Api1.run()}}");
    agHelper.ClickButton("Submit");
    assertHelper.AssertNetworkStatus("@postExecute", 200);

    jsEditor.CreateJSObject(codeToSet, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
      prettify: true,
    });
    entityExplorer.SelectEntityByName("Button1");
    // on submitting the button run the query and assert the toast message
    propPane.EnterJSContext("onClick", "{{JSObject1.run()}}");
    deployMode.DeployApp();
    agHelper.ClickButton("Submit");
    agHelper.ValidateToastMessage("Total record returned: 10");
    deployMode.NavigateBacktoEditor();
    entityExplorer.DeleteWidgetFromEntityExplorer("Button1");
  });

  it("2. Checking form settings - enabled & disabled", () => {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.FORM);
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.INPUT_V2, 200, 200);
    propPane.SelectPropertiesDropDown("Data type", "Email");
    agHelper.TypeText(clocators.inputField, fakerHelper.GetRandomNumber());
    // assert submit button us disabled
    agHelper.AssertElementClassContainsDisabled(
      locators._buttonWidgetInForm,
      0,
    );
    deployMode.DeployApp();
    // assert submit button us enabled
    agHelper.AssertElementEnabledDisabled(
      locators._buttonWidgetInForm,
      1,
      false,
    );
    // set invalid text
    agHelper.TypeText(clocators.inputField, fakerHelper.GetRandomNumber());
    // assert submit button us disabled
    agHelper.AssertElementEnabledDisabled(locators._buttonWidgetInForm);
    deployMode.NavigateBacktoEditor();
    entityExplorer.ExpandCollapseEntity("Form1");
    entityExplorer.SelectEntityByName("Button1");
    // disable form validation
    propPane.TogglePropertyState("Disabled invalid forms", "Off");
    // set invalid text
    agHelper.TypeText(clocators.inputField, fakerHelper.GetRandomNumber());
    // assert submit button us enabled since disabled invalid form is off
    agHelper.AssertElementEnabledDisabled(
      locators._buttonWidgetInForm,
      1,
      false,
    );
    // ssert submit button us enabled since disabled invalid form is off in deploy mode

    deployMode.DeployApp();
    agHelper.TypeText(clocators.inputField, fakerHelper.GetRandomNumber());
    agHelper.AssertElementEnabledDisabled(
      locators._buttonWidgetInForm,
      1,
      false,
    );
    deployMode.NavigateBacktoEditor();
    entityExplorer.DeleteWidgetFromEntityExplorer("Form1");
  });

  it("3. Checking on click", () => {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.FORM);
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.INPUT_V2, 200, 200);
    propPane.SelectPropertiesDropDown("Data type", "Email");
    propPane.UpdatePropertyFieldValue(
      "Default value",
      "{{Api1.data[0].email}}",
    );
    entityExplorer.SelectEntityByName("Api1", "Queries/JS");
    apiPage.RunAPI();
    entityExplorer.SelectEntityByName("Form1");
    // assert submit button us enabled
    agHelper.AssertElementEnabledDisabled(
      locators._buttonWidgetInForm,
      0,
      false,
    );
    entityExplorer.SelectEntityByName("Button1");
    propPane.SelectPlatformFunction("onClick", "Show alert");
    agHelper.TypeText(
      propPane._actionSelectorFieldByLabel("Message"),
      "{{Input1.text}}",
    );
    entityExplorer.SelectEntityByName("Form1");
    agHelper.ClickButton("Submit");
    // assert form value before deploy
    agHelper.ValidateToastMessage("@example");
    // assert after deploy
    deployMode.DeployApp();
    agHelper.Sleep();
    agHelper.ClickButton("Submit");
    agHelper.ValidateToastMessage("@example");
    deployMode.NavigateBacktoEditor();
    entityExplorer.DeleteWidgetFromEntityExplorer("Form1");
  });

  it("4. Checking reset on success - enabled and disabled", () => {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.FORM);
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.INPUT_V2, 200, 200);
    propPane.SelectPropertiesDropDown("Data type", "Email");
    propPane.UpdatePropertyFieldValue(
      "Default value",
      "{{Api1.data[0].email}}",
    );
    entityExplorer.SelectEntityByName("Api1", "Queries/JS");
    apiPage.RunAPI();
    entityExplorer.ExpandCollapseEntity("Form1");
    entityExplorer.SelectEntityByName("Button1");
    propPane.SelectPlatformFunction("onClick", "Show alert");
    agHelper.TypeText(
      propPane._actionSelectorFieldByLabel("Message"),
      "{{Input1.text}}",
    );
    deployMode.DeployApp();
    agHelper.Sleep();
    // set the email
    agHelper.ClickButton("Submit");
    agHelper.WaitUntilEleAppear(locators._toastMsg);
    // on submit form should be reset and default value should ahve populated
    agHelper.ValidateToastMessage("@example");
    deployMode.NavigateBacktoEditor();
    entityExplorer.ExpandCollapseEntity("Form1");
    entityExplorer.SelectEntityByName("Button1");
    propPane.TogglePropertyState("Reset form on success", "Off");
    deployMode.DeployApp();
    agHelper.Sleep();
    // set the email
    agHelper.ClearNType(clocators.inputField, Cypress.env("USERNAME"));
    agHelper.ClickButton("Submit");
    agHelper.WaitUntilEleAppear(locators._toastMsg);
    // assert the email on submit
    agHelper.ValidateToastMessage(Cypress.env("USERNAME"));
    agHelper.ClickButton("Submit");
    agHelper.WaitUntilEleAppear(locators._toastMsg);
    // default is set to a different value, so after submit it should not reset to default value,
    // hene assert the same email which was set
    agHelper.ValidateToastMessage(Cypress.env("USERNAME"));
    deployMode.NavigateBacktoEditor();
  });
});
