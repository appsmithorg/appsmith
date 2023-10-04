import {
  agHelper,
  apiPage,
  dataSources,
  dataManager,
  homePage,
  entityExplorer,
} from "../../../support/Objects/ObjectsCore";

describe("Authentiacted Api with OAuth 2.O authorization code test cases", function () {
  it("1. Create & Save an Authenticated API with OAuth 2.O authorization code", function () {
    // Create OAuth client
    dataSources.CreateOAuthClient("authorization_code");
    // Create datasource
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      cy.get("@OAuthClientID").then((clientId: any) => {
        cy.get("@OAuthClientSecret").then((clientSecret: any) => {
          dataSources.CreateOAuthDatasource(
            "TED_OAuth" + uid,
            "AuthCode",
            clientId,
            clientSecret,
          );
          //Create API from datasource
          apiPage.CreateAndFillApi(
            dataManager.dsValues[dataManager.defaultEnviorment].OAuth_ApiUrl +
              "/api/echo/get?ASDSA=ASDSA",
            "EchoOauth",
            10000,
            "GET",
            true,
          );
        });
      });
    });
    //Run API & Validate Response
    apiPage.RunAPI();
    apiPage.ResponseStatusCheck("200");
  });

  it.only("2. OAuth App Import test into new workspace", function () {
    homePage.CreateNewWorkspace("OAuthImport", true);
    homePage.ImportApp("ImportApps/Ted_OAuthApp.json", "OAuthImport");
    cy.wait("@importNewApplication").then(() => {
      agHelper.Sleep();
      dataSources.ReconnectSingleDSNAssert("TED_OAuth", "REST API", "Save");
    });
    agHelper.ClickButton("Got it");
    entityExplorer.SelectEntityByName("TED_OAuth");
  });

  it.only("3. OAuth App Fork test into same workspace", function () {
    homePage.CreateNewWorkspace("OAuthFork", true);
    homePage.ForkApplication("Ted_OAuthApp", "OAuthFork");
    agHelper.Sleep(500);
    homePage.ForkApplication("Ted_OAuthApp", "OAuthFork");
    dataSources.CreateOAuthCredsNFillAuthenticatedRestApi();
    dataSources.TestSaveDatasource(true, true);
  });
});
