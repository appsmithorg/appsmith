import {
  agHelper,
  apiPage,
  dataSources,
  dataManager,
} from "../../../support/Objects/ObjectsCore";

describe(
  "Authentiacted Api with OAuth 2.O authorization code test cases",
  {
    tags: ["@tag.Datasource", "@tag.Sanity", "@tag.Git", "@tag.AccessControl"],
  },
  function () {
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
  },
);
