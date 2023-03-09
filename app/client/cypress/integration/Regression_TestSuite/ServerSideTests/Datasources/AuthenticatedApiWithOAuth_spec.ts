import * as _ from "../../../../support/Objects/ObjectsCore";
import datasourceFormData from "../../../../fixtures/datasources.json";
let clientId: any, clientSecret: any, formData, clientData;

describe("Authentiacted Api with OAuth 2.O authorization code test cases", function() {
  it("1. Create & Save an Authenticated API with OAuth 2.O authorization code", function() {
    // Login to TED OAuth
    formData = new FormData();
    clientData = new FormData();
    formData.append("username", datasourceFormData["OAuth_username"]);
    cy.request("POST", "http://localhost:6001", formData).then((response) => {
      expect(response.status).to.equal(200);
    });
    clientData.append("client_name", "appsmith_cs_post");
    clientData.append("client_uri", "http://localhost/");
    clientData.append("scope", "profile");
    clientData.append(
      "redirect_uri",
      "http://localhost/api/v1/datasources/authorize",
    );
    clientData.append("grant_type", "authorization_code");
    clientData.append("response_type", "code");
    clientData.append("token_endpoint_auth_method", "client_secret_post");
    cy.request("POST", "http://localhost:6001/create_client", clientData).then(
      (response) => {
        expect(response.status).to.equal(200);
      },
    );
    cy.request("GET", "http://localhost:6001").then((response) => {
      cy.log("response", response.body);
      clientId = response.body.split("client_id: </strong>");
      clientId = clientId[1].split("<strong>client_secret: </strong>");
      clientSecret = clientId[1].split("<strong>");
      clientSecret = clientSecret[0];
      clientId = clientId[0];
      cy.log("clientId ", clientId);
      cy.log("clientSecret ", clientSecret);
      cy.log("typeof ", typeof clientSecret);
      // Create datasource
      _.agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        _.dataSources.CreateOAuthDatasource(
          "TED_OAuth_Api_" + uid,
          "AuthCode",
          clientId.trim(),
          clientSecret.trim(),
        );
        //Create API from datasource
        _.dataSources.CreateAndFillApiAfterDSSaved(
          "/api/echo/get?ASDSA=ASDSA",
          "EchoAPI_" + uid,
          "GET",
        );
      });
    });
    //Run API & Validate Response
    _.apiPage.RunAPI();
    _.apiPage.ResponseStatusCheck("200");
  });
});
