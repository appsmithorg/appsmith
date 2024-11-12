const apiwidget = require("../../../../locators/apiWidgetslocator.json");
import {
  apiPage,
  assertHelper,
  agHelper,
} from "../../../../support/Objects/ObjectsCore";

describe(
  "Test curl import flow",
  { tags: ["@tag.Datasource", "@tag.Git", "@tag.AccessControl"] },
  function () {
    it("1. Test curl import flow for POST action with JSON body", function () {
      cy.fixture("datasources").then((datasourceFormData) => {
        localStorage.setItem("ApiPaneV2", "ApiPaneV2");
        apiPage.FillCurlNImport(
          'curl -d \'{"name":"morpheus","job":"leader"}\' -H Content-Type:application/json -X POST ' +
            datasourceFormData["echoApiUrl"],
          {
            force: true,
            parseSpecialCharSequences: false,
          },
        );
        assertHelper.AssertNetworkExecutionSuccess("@postExecute");
        cy.get("@curlImport").then((response) => {
          cy.expect(response.response.body.responseMeta.success).to.eq(true);
          agHelper.GetObjectName().then((text) => {
            const someText = text;
            expect(someText).to.equal(response.response.body.data.name);
          });
        });
      });
    });

    it("2. Test curl import flow for POST action with multipart form data", function () {
      cy.fixture("datasources").then((datasourceFormData) => {
        apiPage.FillCurlNImport(
          `curl --request POST ${datasourceFormData["multipartAPI"]} -F 'randomKey=randomValue' --form 'randomKey2=\"randomValue2\"'`,
        );
        cy.get("@postExecute").then((response) => {
          cy.log(response);
          cy.expect(response.response.body.responseMeta.success).to.eq(true);
          // Asserting if the form key value are returned in the response
          cy.expect(response.response.body.data.body.data.randomKey).to.eq(
            "randomValue",
          );
          apiPage.ValidateHeaderParams({
            key: "Content-Type",
            value: "multipart/form-data",
          });
        });
      });
    });
  },
);
