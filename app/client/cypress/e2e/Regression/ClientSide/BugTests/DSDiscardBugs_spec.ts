import * as _ from "../../../../support/Objects/ObjectsCore";

let dsName: any;

const testString = "test";

describe("datasource unsaved changes popup shows even without changes", function () {
  // In case of postgres and other plugins, host address and port key values are initialized by default making form dirty
  it("1. Bug 18664: Create postgres datasource, save it and edit it and go back, now unsaved changes popup should not be shown", () => {
    _.dataSources.NavigateToDSCreateNew();
    _.agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      // using CreatePlugIn function instead of CreateDatasource,
      // because I do not need to fill the datasource form and use the same default data
      _.dataSources.CreatePlugIn("PostgreSQL");
      dsName = "Postgres" + uid;
      _.agHelper.RenameWithInPane(dsName, false);
      _.dataSources.SaveDatasource();
      _.agHelper.Sleep();
      _.dataSources.EditDatasource();
      _.agHelper.GoBack();
      _.agHelper.AssertElementVisible(_.dataSources._activeDS);
      _.dataSources.DeleteDatasouceFromActiveTab(dsName);
    });
  });

  // In case of Auth DS, headers, query parameters and custom query parameters are being initialized, which makes form dirty
  it("2. Bug 18962: Create REST API datasource, save it and edit it and go back, now unsaved changes popup should not be shown", () => {
    _.dataSources.NavigateToDSCreateNew();
    _.agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      // using CreatePlugIn function instead of CreateDatasource,
      // because I do not need to fill the datasource form and use the same default data
      _.dataSources.CreatePlugIn("Authenticated API");
      dsName = "AuthDS" + uid;
      _.agHelper.RenameWithInPane(dsName, false);
      _.dataSources.FillAuthAPIUrl();
      _.dataSources.SaveDatasource();
      _.agHelper.Sleep();

      // Edit DS for the first time, we shouldnt see discard popup on back button
      // Even if headers, and query parameters are being initialized, we shouldnt see the popup
      // as those are not initialized by user
      _.dataSources.EditDatasource();
      _.agHelper.GoBack();
      _.agHelper.AssertElementVisible(_.dataSources._activeDS);

      // Edit DS from active tab and add oauth2 details
      _.dataSources.EditDSFromActiveTab(dsName);
      _.dataSources.AddOAuth2AuthorizationCodeDetails(
        testString,
        testString,
        testString,
        testString,
      );
      _.dataSources.UpdateDatasource();
      _.agHelper.Sleep();

      // Now edit DS, and ensure that discard popup is not shown on back button click
      // Even if custom authentication params are being initialized, we shouldnt see the popup
      // as those are not initialized by user
      _.dataSources.EditDatasource();
      _.agHelper.GoBack();
      _.agHelper.AssertElementVisible(_.dataSources._activeDS);

      _.dataSources.DeleteDatasouceFromActiveTab(dsName);
    });
  });

  it("3. Bug 18998: Create mongoDB datasource, save it and edit it and change connection URI param, discard popup should be shown as user has made valid change", () => {
    _.dataSources.NavigateToDSCreateNew();
    _.agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      // using CreatePlugIn function instead of CreateDatasource,
      // because I do not need to fill the datasource form and use the same default data
      _.dataSources.CreatePlugIn("MongoDB");
      dsName = "Mongo" + uid;
      _.agHelper.RenameWithInPane(dsName, false);
      _.dataSources.FillMongoDSForm();
      _.dataSources.SaveDatasource();
      _.agHelper.Sleep();

      // Edit datasource, change connection string uri param and click on back button
      _.dataSources.EditDatasource();
      _.dataSources.FillMongoDatasourceFormWithURI();

      // Assert that popup is visible
      _.dataSources.SaveDSFromDialog(false);

      _.dataSources.DeleteDatasouceFromActiveTab(dsName);
    });
  });

  it("4. Bug 19801: Create new Auth DS, refresh the page without saving, we should not see discard popup", () => {
    _.dataSources.NavigateToDSCreateNew();
    _.agHelper.GenerateUUID();
    // using CreatePlugIn function instead of CreateDatasource,
    // because I do not need to fill the datasource form and use the same default data
    _.dataSources.CreatePlugIn("Authenticated API");
    _.agHelper.RefreshPage();
    _.agHelper.AssertElementAbsence(_.dataSources._datasourceModalSave);
  });
});
