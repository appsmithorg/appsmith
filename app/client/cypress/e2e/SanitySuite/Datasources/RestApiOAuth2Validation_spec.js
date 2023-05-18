const testdata = require("../../../fixtures/testdata.json");
const datasource = require("../../../locators/DatasourcesEditor.json");
import * as _ from "../../../support/Objects/ObjectsCore";

describe("Datasource form OAuth2 client credentials related tests", function () {
  it("1. Create an API with app url and save as Datasource for Client Credentials test", function () {
    _.apiPage.CreateAndFillApi(testdata.appUrl, "TestOAuth");
    _.agHelper.GetNClick(_.apiPage._saveAsDS);
    // agHelper.ValidateToastMessage("datasource created"); //verifying there is no error toast, Bug 14566
  });

  it("2. Add Oauth details to datasource and save", function () {
    cy.get(datasource.saveBtn).should("not.be.disabled");
    _.dataSources.AddOAuth2AuthorizationCodeDetails(
      testdata.accessTokenUrl,
      testdata.clientID,
      testdata.clientSecret,
      testdata.oauth2Scopes,
    );

    // since we are moving to different, it will show unsaved changes dialog
    // save datasource and then proceed
    _.dataSources.SaveDatasource();

    _.entityExplorer.SelectEntityByName("TestOAuth", "Queries/JS");
    _.agHelper.ActionContextMenuWithInPane("Delete", "Are you sure?");
  });

  it("3. Create an API with app url and save as Datasource for Authorization code details test", function () {
    _.apiPage.CreateAndFillApi(testdata.appUrl, "TestOAuth");
    _.agHelper.GetNClick(_.apiPage._saveAsDS);
    // agHelper.ValidateToastMessage("datasource created"); //verifying there is no error toast, Bug 14566
  });

  it("4. Add Oauth details to datasource and save", function () {
    cy.get(datasource.saveBtn).should("not.be.disabled");
    _.dataSources.AddOAuth2AuthorizationCodeDetails(
      testdata.accessTokenUrl,
      testdata.clientID,
      testdata.clientSecret,
      testdata.authorizationURL,
    );
  });

  it("5. Validate save and Authorise", function () {
    cy.get(datasource.saveAndAuthorize).click();
    cy.contains("#login-submit", "Login");
    cy.url().should("include", "oauth.mocklab.io/oauth/authorize");
    cy.xpath('//input[@name="email"]').type("Test@email.com");
    cy.xpath('//input[@name="email"]').type("Test");
    cy.xpath("//input[@name='password']").type("Test@123");
    cy.xpath("//input[@id='login-submit']").click();
  });
});
