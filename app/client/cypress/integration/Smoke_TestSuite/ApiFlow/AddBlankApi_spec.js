const ApiEditor = require("../../../locators/ApiEditor.json");

describe("Test Add blank API flow", function() {
  it("Test Add blank API flow", function() {
    localStorage.setItem("ApiPaneV2", "ApiPaneV2");
    cy.NavigateToApiEditor();
    cy.testCreateApiButton();
    cy.get("@createNewApi").then(response => {
      cy.get(ApiEditor.ApiNameField).should("be.visible");
      cy.expect(response.response.body.responseMeta.success).to.eq(true);
      cy.get(ApiEditor.ApiNameField).should(
        "have.value",
        response.response.body.data.name,
      );
    });
  });
});
