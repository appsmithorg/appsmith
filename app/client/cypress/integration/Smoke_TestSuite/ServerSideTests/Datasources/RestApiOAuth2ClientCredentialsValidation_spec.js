const testdata = require("../../../../fixtures/testdata.json");
const datasource = require("../../../../locators/DatasourcesEditor.json");
const apiwidget = require("../../../../locators/apiWidgetslocator.json");

describe("Datasource form OAuth2 client credentials related tests", function() {
  it("1. Create an API with app url and save as Datasource", function() {
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("TestOAuth");
    cy.get(apiwidget.resourceUrl)
      .first()
      .click({ force: true })
      .type(testdata.appUrl);
    cy.get(".t--store-as-datasource").click();
    agHelper.ValidateToastMessage("datasource created"); //verifying there is no error toast, Bug 14566
  });

  it("2. Add Oauth details to datasource and save", function() {
    cy.get(datasource.saveBtn).should("not.be.disabled");
    cy.addOAuth2ClientCredentialsDetails(
      testdata.accessTokenUrl,
      testdata.clientID,
      testdata.clientSecret,
      testdata.oauth2Scopes,
    );
  });
});
