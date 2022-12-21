import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let dsName: any;

const agHelper = ObjectsRegistry.AggregateHelper,
  dataSources = ObjectsRegistry.DataSources;

const testString = "test";

describe("datasource unsaved changes popup shows even without changes", function() {
  // In case of postgres and other plugins, host address and port key values are initialized by default making form dirty
  it("1. Create postgres datasource, save it and edit it and go back, now unsaved changes popup should not be shown", () => {
    dataSources.NavigateToDSCreateNew();
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      dataSources.CreatePlugIn("PostgreSQL");
      dsName = "Postgres" + uid;
      agHelper.RenameWithInPane(dsName, false);
      dataSources.SaveDatasource();
      cy.wait(1000);
      dataSources.EditDatasource();
      agHelper.GoBack();
      agHelper.AssertElementVisible(dataSources._activeDS);
      dataSources.DeleteDatasouceFromActiveTab(dsName);
    });
  });

  // In case of Auth DS, headers, query parameters and custom query parameters are being initialized, which makes form dirty
  it("2. Create REST API datasource, save it and edit it and go back, now unsaved changes popup should not be shown", () => {
    dataSources.NavigateToDSCreateNew();
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      dataSources.CreatePlugIn("Authenticated API");
      dsName = "AuthDS" + uid;
      agHelper.RenameWithInPane(dsName, false);
      dataSources.FillAuthenticatedAPIForm();
      dataSources.SaveDatasource();
      cy.wait(1000);

      // Edit DS for the first time, we shouldnt see discard popup on back button
      // Even if headers, and query parameters are being initialized, we shouldnt see the popup
      // as those are not initialized by user
      dataSources.EditDatasource();
      agHelper.GoBack();
      agHelper.AssertElementVisible(dataSources._activeDS);

      // Edit DS from active tab and add oauth2 details
      dataSources.EditDSFromActiveTab(dsName);
      dataSources.AddOAuth2AuthorizationCodeDetails(
        testString,
        testString,
        testString,
        testString,
      );
      dataSources.updateDatasource();
      cy.wait(1000);

      // Now edit DS, and ensure that discard popup is not shown on back button click
      // Even if custom authentication params are being initialized, we shouldnt see the popup
      // as those are not initialized by user
      dataSources.EditDatasource();
      agHelper.GoBack();
      agHelper.AssertElementVisible(dataSources._activeDS);

      dataSources.DeleteDatasouceFromActiveTab(dsName);
    });
  });

  it("3. Bug 18998: Create mongoDB datasource, save it and edit it and change connection URI param, discard popup should be shown as user has made valid change", () => {
    dataSources.NavigateToDSCreateNew();
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      dataSources.CreatePlugIn("MongoDB");
      dsName = "Mongo" + uid;
      agHelper.RenameWithInPane(dsName, false);
      dataSources.FillMongoDSForm();
      dataSources.SaveDatasource();
      cy.wait(1000);

      // Edit datasource, change connection string uri param and click on back button
      dataSources.EditDatasource();
      dataSources.FillMongoDatasourceFormWithURI(testString);
      agHelper.GoBack();

      // Assert that popup is visible
      agHelper.AssertElementVisible(dataSources._datasourceModalDoNotSave);
      agHelper.AssertElementVisible(dataSources._datasourceModalSave);
      agHelper.GetNClick(dataSources._datasourceModalSave);

      dataSources.DeleteDatasouceFromActiveTab(dsName);
    });
  });
});
