const apiwidget = require("../../../../locators/apiWidgetslocator.json");

describe("Authenticated API Datasource", function() {
  it("Can create New Authentication API datasource", function() {
    cy.NavigateToAPI_Panel();
    cy.get(apiwidget.createAuthApiDatasource).click({ force: true });
    cy.wait("@createDatasource").should((interception) => {
      expect(interception.response.body.responseMeta.status).to.deep.eq(201);
    });
  });
});
