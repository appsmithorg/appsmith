const ApiEditor = require("../../../locators/ApiEditor.json");

describe("Test 3P provider API import flow", function() {
  it("Test 3P provider API import flow", function() {
    localStorage.setItem("ApiPaneV2", "ApiPaneV2");
    cy.NavigateToApiEditor();
    cy.wait("@get3PProviders").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(ApiEditor.eachProviderCard)
      .first()
      .click({ force: true });
    cy.wait("@get3PProviderTemplates");
    cy.url().should("include", "/edit/api/provider/");
    cy.contains("Add to page").click();
    cy.wait("@add3PApiToPage").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );
    cy.get(ApiEditor.addToPageBtn).should("be.disabled");
    cy.get(ApiEditor.addToPageBtnsId).should("contain", "Added");
  });
});
