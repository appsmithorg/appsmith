import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const agHelper = ObjectsRegistry.AggregateHelper,
  dataSources = ObjectsRegistry.DataSources;

let dsName: any;

describe("Datasource Autosave Improvements Tests", function() {
  // Test to verify that delete button is disabled when datasource is in temporary state.
  it("1. Create postgres datasource, check if delete button is disabled, save and edit ds and check delete button", () => {
    dataSources.NavigateToDSCreateNew();
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      dataSources.CreatePlugIn("PostgreSQL");
      dsName = "Postgres" + uid;
      agHelper.RenameWithInPane(dsName, false);
      // assert delete disabled
      agHelper.AssertElementEnabledDisabled(
        dataSources._deleteDatasourceButton,
      );
      dataSources.SaveDatasource();
      cy.wait(1000);
      dataSources.EditDatasource();
      // assert delete disabled
      agHelper.AssertElementEnabledDisabled(
        dataSources._deleteDatasourceButton,
        0,
        false,
      );
      agHelper.GoBack();
      agHelper.AssertElementVisible(dataSources._activeDS);
      dataSources.DeleteDatasouceFromActiveTab(dsName);
    });
  });

  // Test to verify that when datasource is discarded, no datasource can be seen in active list
  it("2. Create postgres datasource, discard it, datasource should not exist in active list", () => {
    dataSources.NavigateToDSCreateNew();
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      dataSources.CreatePlugIn("PostgreSQL");
      dataSources.FillPostgresDSForm();
      dataSources.SaveDSFromDialog(false);

      // assert that datasource is not saved and cant be seen in active ds list
      dataSources.NavigateToActiveTab();
      agHelper.AssertContains(dsName, "not.exist", dataSources._datasourceCard);
    });
  });

  // Test to verify that when datasource is saved from discard pop, datasource can be seen in active list
  it("3. Create postgres datasource, save datasource from discard popup, and check if it exists in active ds list", () => {
    dataSources.NavigateToDSCreateNew();
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      dataSources.CreatePlugIn("PostgreSQL");

      dsName = "Postgres" + uid;
      agHelper.RenameWithInPane(dsName, false);

      dataSources.FillPostgresDSForm();
      dataSources.SaveDSFromDialog(true);

      // assert that datasource is not saved and cant be seen in active ds list
      dataSources.NavigateToActiveTab();
      agHelper.AssertContains(dsName, "exist", dataSources._datasourceCard);

      // delete datasource
      dataSources.DeleteDatasouceFromActiveTab(dsName);
    });
  });

  // Test to verify that Editing existing datasource, state of save button when new changes are made/not made.
  it("4. Create postgres datasource, save datasource, edit it", () => {
    dataSources.NavigateToDSCreateNew();
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      dataSources.CreateDataSource("Postgres");

      // Edit Datasource, dont make new changes and check state of save
      dataSources.EditDatasource();
      agHelper.AssertElementEnabledDisabled(dataSources._saveDs, 0);

      // Make new changes and check state of datasource
      dataSources.FillPostgresDSForm(false, "username", "password");
      agHelper.AssertElementEnabledDisabled(dataSources._saveDs, 0, false);
      dataSources.UpdateDatasource();

      // delete datasource
      cy.get("@dsName").then(($dsName) => {
        dsName = $dsName;
        dataSources.DeleteDatasouceFromActiveTab(dsName);
      });
    });
  });
});
