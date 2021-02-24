const testdata = require("../../../../fixtures/testdata.json");
const datasource = require("../../../../locators/DatasourcesEditor.json");
const apiwidget = require("../../../../locators/apiWidgetslocator.json");

describe("Datasource form related tests", function() {
  it("Create an API with app url and save as Datasource", function() {
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("TestOAuth");
    cy.get(apiwidget.resourceUrl)
      .first()
      .click({ force: true })
      .type(testdata.appUrl);
    cy.get(".t--store-as-datasource").click();
  });

  it("Add Oauth details to datasource and save", function() {
    cy.get(".t--save-datasource").should("not.be.disabled");
    cy.addOauthAuthDetails(
      testdata.accessTokenUrl,
      testdata.clientID,
      testdata.clientSecret,
    );
  });

  it("validate API response check the response", function() {
    cy.RunAPI();
    cy.ResponseStatusCheck("200");
    cy.get(apiwidget.responseText).should("be.visible");
    cy.get(apiwidget.responseText).contains(testdata.oauthResponse);
  });
});
