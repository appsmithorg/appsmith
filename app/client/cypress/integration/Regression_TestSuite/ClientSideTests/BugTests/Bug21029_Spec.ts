import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Bug: 21029: OAuth - Post query to dropbox fails.", function() {
  it("1. Create & Save an Authenticated API with Dropbox OAuth 2.O authorization code", function() {
    // Create OAuth client
    // cy.origin("https://dropbox.com", () => {
    //   cy.visit("https://www.dropbox.com/login");
    // });

    cy.fixture("datasources").then((datasourceFormData: any) => {
      // Create datasource
      _.agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        _.dataSources.CreateOAuthDatasource(
          "TED_OAuth" + uid,
          datasourceFormData["Dropbox_ApiUrl"],
          "AuthCode",
          datasourceFormData["Dropbox_ClientId"],
          datasourceFormData["Dropbox_ClientSecret"],
          "Dropbox",
        );
        //Create API from datasource
        _.apiPage.CreateAndFillApi(
          datasourceFormData["Dropbox_ApiUrl"] + "/2/files/list_folder",
          "List_Files",
          10000,
          "POST",
          true,
        );
      });
    });
    //Run API & Validate Response
    _.apiPage.RunAPI();
    _.apiPage.ResponseStatusCheck("200");
  });
});
