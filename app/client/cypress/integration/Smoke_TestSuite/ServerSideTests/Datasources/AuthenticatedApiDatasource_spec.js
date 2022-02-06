const apiwidget = require("../../../../locators/apiWidgetslocator.json");

describe("Authenticated API Datasource", function() {
  it("Can create New Authentication API datasource", function() {
    cy.NavigateToAPI_Panel();
    cy.get(apiwidget.createAuthApiDatasource).click({ force: true });
    cy.wait("@createDatasource").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );
  });
});
