import datasourceFormData from "../../../../fixtures/datasources.json";

import {
  apiPage,
  agHelper,
  jsEditor,
  entityItems,
} from "../../../../support/Objects/ObjectsCore";

describe("Test API execution with dynamic binding in URL - Bug #24218", () => {
  it("1. Test API execution with dynamic binding in URL", () => {
    // Create JS Object to set Appsmith store variable to mockApiUrl
    jsEditor.CreateJSObject(
      `export default {
        myVar1: [],
        myVar2: {},
        myFun1 () {
          storeValue("api_url", "${datasourceFormData["mockApiUrl"]}");
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
    apiPage.RunAPI();
    apiPage.ResponseStatusCheck("200 OK");
    agHelper.ActionContextMenuWithInPane({
      action: "Delete",
      entityType: entityItems.Api,
    });
  });
});
