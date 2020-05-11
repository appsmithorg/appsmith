const ApiEditor = require("../../../locators/ApiEditor.json");

describe("Test Add blank API and delete flow", function() {
  it("Test Add blank API and delete flow", function() {
    localStorage.setItem("ApiPaneV2", "ApiPaneV2");
    cy.NavigateToApiEditor();
    cy.testCreateApiButton();
    cy.get("@createNewApi").then(httpResponse => {
      cy.expect(httpResponse.response.body.responseMeta.success).to.eq(true);
      cy.get(ApiEditor.ApiNameField).should(
        "have.value",
        httpResponse.response.body.data.name,
      );
    });
    cy.get(ApiEditor.ApiNameField).should("be.visible");
    cy.get(ApiEditor.ApiDeleteBtn).click();
    cy.get(ApiEditor.ApiDeleteBtn).should("be.disabled");
    cy.testDeleteApi();
    cy.get(ApiEditor.ApiHomePage).should("be.visible");
    cy.get(ApiEditor.formActionButtons).should("not.be.visible");
    cy.get("@deleteAction").then(httpResponse => {
      cy.expect(httpResponse.response.body.responseMeta.success).to.eq(true);
    });
  });
});
