import * as _ from "../../../../support/Objects/ObjectsCore";
import datasourceFormData from "../../../../fixtures/datasources.json";

describe("Authentiacted Api with OAuth 2.O authorization code test cases", function() {
  it("1. Create & Save an Authenticated API with OAuth 2.O authorization code", function() {
    // Login to TED OAuth
    var formdata = new FormData();
    formdata.append("username", datasourceFormData["OAuth_username"]);
    cy.request("POST", "http://localhost:6001", formdata).then((response) => {
      expect(response.status).to.equal(200);
    });

    // Create datasource
    _.agHelper.GenerateUUID()
    cy.get("@guid").then((uid) => {
    _.dataSources.CreateOAuthDatasource("TED_OAuth_Api_"+uid, "AuthCode");

    //Create API from datasource
    _.dataSources.CreateAndFillApiAfterDSSaved(
      "/api/echo/get?ASDSA=ASDSA",
      "EchoAPI_"+uid,
      "GET",
    );
    });

    //Run API & Validate Response
    _.apiPage.RunAPI();
    _.apiPage.ResponseStatusCheck("200");
  });
});
