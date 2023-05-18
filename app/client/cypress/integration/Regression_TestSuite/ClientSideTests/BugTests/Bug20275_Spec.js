import { ObjectsRegistry } from "../../../../support/Objects/Registry";
import { WIDGET } from "../../../../locators/WidgetLocators";

const jsEditor = ObjectsRegistry.JSEditor,
  agHelper = ObjectsRegistry.AggregateHelper,
  deployMode = ObjectsRegistry.DeployMode,
  locator = ObjectsRegistry.CommonLocators,
  ee = ObjectsRegistry.EntityExplorer,
  propPane = ObjectsRegistry.PropertyPane;

describe("Testing if user.email is avaible on page load", function () {
  it("Bug: 20275: {{appsmith.user.email}} is not available on page load", function () {
    const JS_OBJECT_BODY = `export default{
        myFun1: ()=>{
          showAlert(appsmith.user.email)
        },
    }`;

    jsEditor.CreateJSObject(JS_OBJECT_BODY, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
      prettify: false,
    });

    jsEditor.EnableDisableAsyncFuncSettings("myFun1", true, false);

    ee.DragDropWidgetNVerify(WIDGET.TEXT, 200, 600);
    ee.SelectEntityByName("Text1");
    propPane.TypeTextIntoField("Text", "{{appsmith.user.email}}");

    deployMode.DeployApp();

    agHelper.ValidateToastMessage(Cypress.env("USERNAME"));

    agHelper
      .GetText(locator._textWidgetInDeployed)
      .then(($userEmail) => expect($userEmail).to.eq(Cypress.env("USERNAME")));
  });
});
