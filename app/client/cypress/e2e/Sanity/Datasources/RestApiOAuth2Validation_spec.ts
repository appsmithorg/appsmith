import {
  agHelper,
  assertHelper,
  entityExplorer,
  entityItems,
  apiPage,
  dataSources,
  dataManager,
} from "../../../support/Objects/ObjectsCore";

describe.skip(
  "Datasource form OAuth2 client credentials related tests",
  {
    tags: ["@tag.Datasource", "@tag.Sanity", "@tag.Git", "@tag.AccessControl"],
  },
  function () {
    let clientId, clientSecret;

    //Existing Bug:  https://github.com/appsmithorg/appsmith/issues/37353
    it.skip("1. Create an API with app url and save as Datasource for Authorization code details test", function () {
      dataSources.CreateOAuthClient("authorization_code");
      apiPage.CreateAndFillApi(
        dataManager.dsValues[dataManager.defaultEnviorment].OAuth_ApiUrl +
          "/api/echo/get?ASDSA=ASDSA",
        "TestOAuth",
      );
      agHelper.GetNClick(apiPage._saveAsDS);
      //Add Oauth details to datasource and save
      agHelper.AssertElementEnabledDisabled(dataSources._saveDs, 0, false);
      cy.get("@OAuthClientID").then((id) => {
        cy.get("@OAuthClientSecret").then((secret) => {
          clientId = id;
          clientSecret = secret;
          dataSources.AddOAuth2AuthorizationCodeDetails(
            dataManager.dsValues[dataManager.defaultEnviorment]
              .OAUth_AccessTokenUrl,
            clientId,
            clientSecret,
            dataManager.dsValues[dataManager.defaultEnviorment].OAuth_AuthUrl,
          );
        });
      });
    });

    it.skip("2. Validate save and Authorise", function () {
      agHelper.GetNClick(dataSources._saveDs);

      //Accept consent
      agHelper.GetNClick(dataSources._consent);
      agHelper.GetNClick(dataSources._consentSubmit);

      //Validate save
      assertHelper.AssertNetworkStatus("@saveDatasource", 201);
    });
  },
);
