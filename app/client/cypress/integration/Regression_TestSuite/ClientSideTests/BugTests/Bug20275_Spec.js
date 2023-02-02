import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const jsEditor = ObjectsRegistry.JSEditor,
  agHelper = ObjectsRegistry.AggregateHelper,
  deployMode = ObjectsRegistry.DeployMode;

describe("Testing if user.email is avaible on page load", function() {
  it("Bug: 20275: {{appsmith.user.email}} is not available on page load", function() {
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

    deployMode.DeployApp();

    agHelper.ValidateToastMessage(Cypress.env("USERNAME"));
  });
});
