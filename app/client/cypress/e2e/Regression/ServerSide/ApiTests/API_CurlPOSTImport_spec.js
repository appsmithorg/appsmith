const apiwidget = require("../../../../locators/apiWidgetslocator.json");
import ApiEditor from "../../../../locators/ApiEditor";
import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Test curl import flow", function () {
  it("1. Test curl import flow for POST action with JSON body", function () {
    cy.fixture("datasources").then((datasourceFormData) => {
      localStorage.setItem("ApiPaneV2", "ApiPaneV2");
      cy.NavigateToApiEditor();
      _.dataSources.NavigateToDSCreateNew();
      cy.get(ApiEditor.curlImage).click({ force: true });
      cy.get("textarea").type(
        'curl -d \'{"name":"morpheus","job":"leader"}\' -H Content-Type:application/json -X POST ' +
          datasourceFormData["echoApiUrl"],
        {
          force: true,
          parseSpecialCharSequences: false,
        },
      );
      cy.importCurl();
      cy.RunAPI();
      cy.ResponseStatusCheck("200 OK");
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
    localStorage.setItem("ApiPaneV2", "ApiPaneV2");
    cy.NavigateToApiEditor();
    _.dataSources.NavigateToDSCreateNew();

    cy.get(ApiEditor.curlImage).click({ force: true });
    cy.get("textarea").type(
      "curl --request POST http://host.docker.internal:5001/v1/mock-api/echo-multipart -F 'randomKey=randomValue' --form 'randomKey2=\"randomValue2\"'",
      {
        force: true,
        parseSpecialCharSequences: false,
      },
    );
    cy.importCurl();
    cy.RunAPI();
    cy.ResponseStatusCheck("200 OK");
    cy.log("Ran the API successfully");

    _.apiPage.ValidateHeaderParams({
      key: "Content-Type",
      value: "multipart/form-data",
    });
  });
});
