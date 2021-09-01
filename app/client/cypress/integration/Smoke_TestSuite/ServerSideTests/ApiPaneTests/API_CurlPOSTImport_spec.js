const ApiEditor = require("../../../../locators/ApiEditor.json");
const apiwidget = require("../../../../locators/apiWidgetslocator.json");
const pages = require("../../../../locators/Pages.json");

describe("Test curl import flow", function() {
  it("Test curl import flow for POST action with JSON body", function() {
    localStorage.setItem("ApiPaneV2", "ApiPaneV2");
    cy.NavigateToApiEditor();
    cy.get(pages.integrationCreateNew)
      .should("be.visible")
      .click({ force: true });
    cy.get(ApiEditor.curlImage).click({ force: true });
    cy.get("textarea").type(
      'curl -d \'{"name":"morpheus","job":"leader"}\' -H Content-Type:application/json -X POST https://mock-api.appsmith.com/echo/post',
      {
        force: true,
        parseSpecialCharSequences: false,
      },
    );
    cy.importCurl();
    cy.RunAPI();
    cy.ResponseStatusCheck("201 CREATED");
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

  it("Test curl import flow for POST action with multipart form data", function() {
    localStorage.setItem("ApiPaneV2", "ApiPaneV2");
    cy.NavigateToApiEditor();
    cy.get(pages.integrationCreateNew)
      .should("be.visible")
      .click({ force: true });
    cy.get(ApiEditor.curlImage).click({ force: true });
    cy.get("textarea").type(
      "curl --request POST http://httpbin.org/post -F 'randomKey=randomValue' --form 'randomKey2=\"randomValue2\"'",
      {
        force: true,
        parseSpecialCharSequences: false,
      },
    );
    cy.importCurl();
    cy.RunAPI();
    cy.ResponseStatusCheck("200 OK");
    cy.log("Ran the API successfully");
    cy.get("@postExecute").then((response) => {
      cy.log(response.response.body);
      cy.expect(response.response.body.responseMeta.success).to.eq(true);
      // Asserting if the form key value are returned in the response
      cy.expect(response.response.body.data.body.form.randomKey).to.eq(
        "randomValue",
      );
      // Asserting the content type header set in curl import is multipart/form-data
      cy.expect(
        response.response.body.data.body.headers["Content-Type"],
      ).contains("multipart/form-data;boundary");
    });
  });
});
