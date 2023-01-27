import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let dsName: string;
const agHelper = ObjectsRegistry.AggregateHelper,
  dataSources = ObjectsRegistry.DataSources;

const testString = "test";

describe("Bug 19933: Authenticated API DS in case of OAuth2, should have save and authorise button enabled all the times", function() {
  it("1. Create Auth API DS, save i, now edit again and check the save and authorise button state", function() {
    dataSources.NavigateToDSCreateNew();
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      dsName = "AuthAPI " + uid;
      dataSources.CreatePlugIn("Authenticated API");
      agHelper.RenameWithInPane(dsName, false);
      dataSources.FillAuthAPIUrl();
      dataSources.AddOAuth2AuthorizationCodeDetails(
        testString,
        testString,
        testString,
        testString,
      );
      dataSources.SaveDatasource();
    });

    dataSources.EditDatasource();
    agHelper.AssertElementEnabledDisabled(
      dataSources._saveAndAuthorizeDS,
      0,
      false,
    );

    dataSources.DeleteDSDirectly();
  });
});
