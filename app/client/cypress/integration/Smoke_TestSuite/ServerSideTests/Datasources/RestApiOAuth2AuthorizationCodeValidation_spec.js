const testdata = require("../../../../fixtures/testdata.json");
const datasource = require("../../../../locators/DatasourcesEditor.json");
const apiwidget = require("../../../../locators/apiWidgetslocator.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";
const agHelper = ObjectsRegistry.AggregateHelper;


describe("Datasource form OAuth2 authorization code related tests", function() {
  it("Create an API with app url and save as Datasource", function() {
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("TestOAuth");
    cy.get(apiwidget.resourceUrl)
      .first()
      .click({ force: true })
      .type(testdata.appUrl);
    cy.get(".t--store-as-datasource").click();
    cy.wait("@createDatasource").then((interception) => {
      cy.log(interception.response.body.data);
    });
    agHelper.ValidateToastMessage("datasource created"); //verifying there is no error toast, Bug 14566
  });

  it("Add Oauth details to datasource and save", function() {
    cy.get(datasource.saveBtn).should("not.be.disabled");
    cy.addOAuth2AuthorizationCodeDetails(
      testdata.accessTokenUrl,
      testdata.clientID,
      testdata.clientSecret,
      testdata.authorizationURL,
    );
  });

  it("validate save and Authorise", function() {
    cy.get(datasource.saveAndAuthorize).click();
    cy.contains("#login-submit", "Login");
    cy.url().should("include", "oauth.mocklab.io/oauth/authorize");
    cy.xpath('//input[@name="email"]').type("Test@email.com");
    cy.xpath('//input[@name="email"]').type("Test");
    cy.xpath("//input[@name='password']").type("Test@123");
    cy.xpath("//input[@id='login-submit']").click();
  });
});
