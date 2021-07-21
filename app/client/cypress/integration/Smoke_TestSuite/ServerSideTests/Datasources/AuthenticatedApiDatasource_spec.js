const apiwidget = require("../../../../locators/apiWidgetslocator.json");

describe("Authenticated API Datasource", function() {
  it("Can create New Authentication API datasource", function() {
    cy.NavigateToAPI_Panel();
    cy.get(apiwidget.createOAuthDatasource).click({ force: true });
    cy.wait("@createDatasource").then((interception) => {
      expect(interception.status).to.equal(201);
      expect(
        interception.response.body.data.datasourceConfiguration.authentication
          .authenticationType,
      ).to.equal("oAuth2");
    });
  });
});
