const ApiEditor = require("../../../locators/ApiEditor.json");

describe("Test Add api blank and execute api flow", function() {
  it("Test Add blank api and execute api by selecting available datasource", function() {
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
    cy.get(ApiEditor.dataSourceField).click();
    cy.contains("https://jsonplaceholder.typicode.com/posts/1/comments").click({
      force: true,
    });
    cy.get(ApiEditor.ApiRunBtn).click();
    cy.get(ApiEditor.ApiRunBtn).should("be.disabled");
    cy.wait("@executeAction").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(ApiEditor.formActionButtons).should("be.visible");
    cy.get(ApiEditor.ApiRunBtn).should("not.be.disabled");
  });
});
