import {
  apiPage,
  agHelper,
  jsEditor,
  entityItems,
  dataManager,
} from "../../../../support/Objects/ObjectsCore";

describe(
  "Test API execution with dynamic binding in URL - Bug #24218",
  { tags: ["@tag.Datasource", "@tag.Sanity"] },
  () => {
    it("1. Test API execution with dynamic binding in URL", () => {
      // Create JS Object to set Appsmith store variable to mockApiUrl
      jsEditor.CreateJSObject(
        `export default {
        myVar1: [],
        myVar2: {},
        myFun1 () {
          storeValue("api_url", "${
            dataManager.dsValues[dataManager.defaultEnviorment].mockApiUrl
          }");
        },
        myFun2: async function() {
        }
      }`,
        {
          paste: true,
          completeReplace: true,
          toRun: false,
          shouldCreateNewJSObj: true,
          prettify: true,
        },
      );

      jsEditor.RunJSObj();

      // Create API and set URL to {{appsmith.store.api_url}}
      apiPage.CreateAndFillApi(
        "{{appsmith.store.api_url}}",
        "Api_with_dynamic_binding",
      );
      agHelper.VerifyEvaluatedValue(
        dataManager.dsValues[dataManager.defaultEnviorment].mockApiUrl.replace(
          "?records=10",
          "",
        ), //removing query param here due to open bug with DI team
      );
      apiPage.RunAPI();
      apiPage.ResponseStatusCheck("200 OK");
      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Api,
      });
    });
  },
);
