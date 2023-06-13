const apiwidget = require("../../../../locators/apiWidgetslocator.json");
import ApiEditor from "../../../../locators/ApiEditor";
import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Test curl import flow", function () {
  it("1. Test curl import flow for POST action with JSON body", function () {
    cy.fixture("datasources").then((datasourceFormData) => {
      localStorage.setItem("ApiPaneV2", "ApiPaneV2");
      _.dataSources.FillCurlNImport(
        'curl -d \'{"name":"morpheus","job":"leader"}\' -H Content-Type:application/json -X POST ' +
          datasourceFormData["echoApiUrl"],
        {
          force: true,
          parseSpecialCharSequences: false,
        },
      );
      _.agHelper.ValidateNetworkStatus("@postExecute");
      cy.get("@curlImport").then((response) => {
        cy.expect(response.response.body.responseMeta.success).to.eq(true);
        cy.get(apiwidget.ApiName)
          .invoke("text")
          .then((text) => {
            const someText = text;
            expect(someText).to.equal(response.response.body.data.name);
          });
      });
    });
  });

  it("2. Test curl import flow for POST action with multipart form data", function () {
    cy.fixture("datasources").then((datasourceFormData) => {
      _.dataSources.FillCurlNImport(
        `curl --request POST ${datasourceFormData["multipartAPI"]} -F 'randomKey=randomValue' --form 'randomKey2=\"randomValue2\"'`,
      );
      _.apiPage.ValidateHeaderParams({
        key: "Content-Type",
        value: "multipart/form-data",
      });
    });
  });
});
