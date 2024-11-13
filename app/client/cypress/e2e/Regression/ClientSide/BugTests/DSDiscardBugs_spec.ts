import * as _ from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  AppSidebarButton,
} from "../../../../support/Pages/EditorNavigation";

let dsName: any;

const testString = "test";

describe(
  "datasource unsaved changes popup shows even without changes",
  { tags: ["@tag.Datasource", "@tag.Git", "@tag.AccessControl"] },
  function () {
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
        _.dataSources.cancelDSEditAndAssertModalPopUp(false);
        _.agHelper.AssertElementVisibility(_.dataSources._activeDS);
        _.dataSources.DeleteDatasourceFromWithinDS(dsName);
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
        _.dataSources.cancelDSEditAndAssertModalPopUp(false);
        _.agHelper.AssertElementVisibility(_.dataSources._activeDS);
        _.dataSources.DeleteDatasourceFromWithinDS(dsName);
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

        _.dataSources.DeleteDatasourceFromWithinDS(dsName);
      });
    });

    it("4. Validate that the DS modal shows up when cancel button is pressed after change", () => {
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
        _.dataSources.cancelDSEditAndAssertModalPopUp(true, false);

        _.dataSources.DeleteDatasourceFromWithinDS(dsName);
      });
    });

    it("5. Validate that the DS modal does not show up when cancel button is pressed without any changes being made", () => {
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

        // Assert that popup is visible
        _.dataSources.cancelDSEditAndAssertModalPopUp(false, false);

        _.dataSources.DeleteDatasourceFromWithinDS(dsName);
      });
    });

    it("6. Validate that changes made to the form are not persisted after cancellation", () => {
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

        _.agHelper.ClearNType(_.dataSources._host(), "jargons");

        // Assert that popup is visible
        _.dataSources.cancelDSEditAndAssertModalPopUp(true, false);

        // try to edit again
        _.dataSources.EditDatasource();

        // validate the input field value still remains as the saved value
        _.agHelper.ValidateFieldInputValue(
          _.dataSources._host(),
          _.dataManager.dsValues.Staging.mongo_host,
        );
        _.agHelper.GetNClick(
          _.dataSources._cancelEditDatasourceButton,
          0,
          true,
          200,
        );

        _.dataSources.DeleteDatasourceFromWithinDS(dsName);
      });
    });

    it("7. Bug 19801: Create new Auth DS, refresh the page without saving, we should not see discard popup", () => {
      _.dataSources.NavigateToDSCreateNew();
      // using CreatePlugIn function instead of CreateDatasource,
      // because we do not need to fill the datasource form for this case
      _.dataSources.CreatePlugIn("Authenticated API");
      _.agHelper.RefreshPage();
      _.agHelper.AssertElementAbsence(_.dataSources._datasourceModalSave);
    });
  },
);
