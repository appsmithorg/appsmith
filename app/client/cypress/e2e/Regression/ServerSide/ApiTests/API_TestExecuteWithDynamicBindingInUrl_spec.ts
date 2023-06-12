import { agHelper, jsEditor } from "../../../../support/Objects/ObjectsCore";
import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Test API execution with dynamic binding in URL", () => {
  /* Create a JS Object and set TED API URL in an Appsmith store variable. */
  it("1. Set URL in Appsmith store variable", () => {
    jsEditor.CreateJSObject(
      `export default {
        myVar1: [],
        myVar2: {},
        myFun1 () {
          storeValue("api_url", "http://host.docker.internal:5001/v1/dynamicrecords/getstudents");
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

    agHelper.AssertAutoSave();
    jsEditor.RunJSObj();
  });

  /* Create an API with dynamic binding as URL and run it. */
  it("2. Execute API", () => {
    _.apiPage.CreateAndFillApi(
      "{{appsmith.store.api_url}}",
      "Api_with_dynamic_binding",
    );
    _.apiPage.RunAPI();
    _.apiPage.ResponseStatusCheck("200 OK");
    _.agHelper.ActionContextMenuWithInPane("Delete");
  });
});
