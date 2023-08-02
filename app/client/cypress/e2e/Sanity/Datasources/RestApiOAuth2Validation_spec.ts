import testdata from "../../../fixtures/testdata.json";
import datasource from "../../../locators/DatasourcesEditor.json";
import {
  agHelper,
  assertHelper,
  entityExplorer,
  entityItems,
  apiPage,
  dataSources,
  tedTestConfig,
} from "../../../support/Objects/ObjectsCore";
let clientId, clientSecret;

describe("Datasource form OAuth2 client credentials related tests", function () {
  it("1. Create an API with app url and save as Datasource for Client Credentials test", function () {
    dataSources.CreateOAuthClient("authorization_code");
    apiPage.CreateAndFillApi(
      tedTestConfig.dsValues[tedTestConfig.defaultEnviorment].OAuth_ApiUrl +
        "/api/echo/get?ASDSA=ASDSA",
      "TestOAuth",
    );
    agHelper.GetNClick(apiPage._saveAsDS);

    // Add Oauth details to datasource and save
    agHelper.AssertElementEnabledDisabled(datasource.saveBtn, 0, false);
    cy.get("@OAuthClientID").then((id) => {
      cy.get("@OAuthClientSecret").then((secret) => {
        clientId = id;
        clientSecret = secret;
        dataSources.AddOAuth2AuthorizationCodeDetails(
          tedTestConfig.dsValues[tedTestConfig.defaultEnviorment]
            .OAUth_AccessTokenUrl,
          clientId,
          clientSecret,
          testdata.oauth2Scopes,
        );
      });
    });
    // since we are moving to different, it will show unsaved changes dialog
    // save datasource and then proceed
    dataSources.SaveDatasource();
    agHelper.ValidateToastMessage("datasource created"); //verifying there is no error toast, Bug 14566
    entityExplorer.SelectEntityByName("TestOAuth", "Queries/JS");
    agHelper.ActionContextMenuWithInPane({
      action: "Delete",
      entityType: entityItems.Api,
    });
  });

  it("2. Create an API with app url and save as Datasource for Authorization code details test", function () {
    apiPage.CreateAndFillApi(
      tedTestConfig.dsValues[tedTestConfig.defaultEnviorment].OAuth_ApiUrl +
        "/api/echo/get?ASDSA=ASDSA",
      "TestOAuth",
    );
    agHelper.GetNClick(apiPage._saveAsDS);
    //Add Oauth details to datasource and save
    agHelper.AssertElementEnabledDisabled(datasource.saveBtn, 0, false);
    dataSources.AddOAuth2AuthorizationCodeDetails(
      tedTestConfig.dsValues[tedTestConfig.defaultEnviorment]
        .OAUth_AccessTokenUrl,
      clientId,
      clientSecret,
      tedTestConfig.dsValues[tedTestConfig.defaultEnviorment].OAuth_AuthUrl,
    );
  });

  it("3. Validate save and Authorise", function () {
    agHelper.GetNClick(dataSources._saveAndAuthorizeDS);

    //Accept consent
    agHelper.GetNClick(dataSources._consent);
    agHelper.GetNClick(dataSources._consentSubmit);

    //Validate save
    assertHelper.AssertNetworkStatus("@saveDatasource", 201);
  });
});
