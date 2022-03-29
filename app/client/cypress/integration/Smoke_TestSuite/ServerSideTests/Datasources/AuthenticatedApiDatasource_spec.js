const apiwidget = require("../../../../locators/apiWidgetslocator.json");
const datasourceFormData = require("../../../../fixtures/datasources.json");

describe("Authenticated API Datasource", function() {
  it("Can create New Authentication API datasource", function() {
    cy.NavigateToAPI_Panel();
    cy.get(apiwidget.createAuthApiDatasource).click({ force: true });
    cy.wait("@createDatasource").should((interception) => {
      expect(interception.response.body.responseMeta.status).to.deep.eq(201);
      cy.fillAuthenticatedAPIForm();
      cy.saveDatasource();
      const URL = datasourceFormData["authenticatedApiUrl"];
      cy.contains(URL);
    });
  });
});
