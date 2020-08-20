const ApiEditor = require("../../../locators/ApiEditor.json");
const apiwidget = require("../../../locators/apiWidgetslocator.json");

describe("Test curl import flow", function() {
  it("Test curl import flow for POST action", function() {
    localStorage.setItem("ApiPaneV2", "ApiPaneV2");
    cy.NavigateToApiEditor();
    cy.get(ApiEditor.curlImage).click({ force: true });
    cy.get("textarea").type(
      'curl -d \'{"name":"morpheus","job":"leader"}\' -H Content-Type:application/json -X POST https://reqres.in/api/users',
      {
        force: true,
        parseSpecialCharSequences: false,
      },
    );
    cy.importCurl();
    cy.RunAPI();
    cy.ResponseStatusCheck("201 CREATED");
    cy.get("@curlImport").then(response => {
      cy.expect(response.response.body.responseMeta.success).to.eq(true);
      cy.get(apiwidget.ApiName)
        .invoke("text")
        .then(text => {
          const someText = text;
          expect(someText).to.equal(response.response.body.data.name);
        });
    });
  });
});
