const ApiEditor = require("../../../locators/ApiEditor.json");

describe("Test curl import flow", function() {
  it("Test curl import flow for POST action", function() {
    localStorage.setItem("ApiPaneV2", "ApiPaneV2");
    cy.NavigateToApiEditor();
    cy.get(ApiEditor.curlImage).click({ force: true });
    cy.get("textarea").type(
      "curl -d { name : 'morpheus',job : 'leader'} -H Content-Type: application/json https://reqres.in/api/users",
      {
        force: true,
        parseSpecialCharSequences: false,
      },
    );
    cy.importCurl();
    cy.get(ApiEditor.ApiNameField).should("be.visible");
    cy.get("@curlImport").then(response => {
      cy.expect(response.response.body.responseMeta.success).to.eq(true);
      cy.get(ApiEditor.ApiNameField).should(
        "have.value",
        response.response.body.data.name,
      );
    });
  });
});
