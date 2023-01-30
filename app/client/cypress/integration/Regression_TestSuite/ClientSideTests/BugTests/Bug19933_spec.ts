import * as _ from "../../../../support/Objects/ObjectsCore";

let dsName: string;

const testString = "test";

describe("Bug 19933: Authenticated API DS in case of OAuth2, should have save and authorise button enabled all the times", function() {
  it("1. Create Auth API DS, save i, now edit again and check the save and authorise button state", function() {
    _.dataSources.NavigateToDSCreateNew();
    _.agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      dsName = "AuthAPI " + uid;
      _.dataSources.CreatePlugIn("Authenticated API");
      _.agHelper.RenameWithInPane(dsName, false);
      _.dataSources.FillAuthAPIUrl();
      _.dataSources.AddOAuth2AuthorizationCodeDetails(
        testString,
        testString,
        testString,
        testString,
      );
      _.dataSources.SaveDatasource();
    });

    _.dataSources.EditDatasource();
    _.agHelper.AssertElementEnabledDisabled(
      _.dataSources._saveAndAuthorizeDS,
      0,
      false,
    );

    _.dataSources.DeleteDSDirectly();
  });
});
