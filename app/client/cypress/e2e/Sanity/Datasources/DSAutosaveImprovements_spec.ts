import { ObjectsRegistry } from "../../../support/Objects/Registry";
import {
  AppSidebar,
  AppSidebarButton,
} from "../../../support/Pages/EditorNavigation";

const agHelper = ObjectsRegistry.AggregateHelper,
  dataSources = ObjectsRegistry.DataSources;

let dsName: any;

describe(
  "Datasource Autosave Improvements Tests",
  {
    tags: ["@tag.Datasource", "@tag.Sanity", "@tag.Git", "@tag.AccessControl"],
  },
  function () {
    it("1. Test to verify that when datasource is discarded, no datasource can be seen in active list", () => {
      dataSources.NavigateToDSCreateNew();
      agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        dataSources.CreatePlugIn("PostgreSQL");
        dataSources.FillPostgresDSForm();
        dataSources.SaveDSFromDialog(false);

        // assert that datasource is not saved and cant be seen in active ds list
        AppSidebar.navigate(AppSidebarButton.Data);
        agHelper.AssertContains(
          dsName,
          "not.exist",
          dataSources._datasourceCard,
        );
      });
    });

    it("2. Test to verify that when datasource is saved from discard pop, datasource can be seen in active list", () => {
      dataSources.NavigateToDSCreateNew();
      agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        dataSources.CreatePlugIn("PostgreSQL");

        dsName = "Postgres" + uid;
        agHelper.RenameDatasource(dsName);

        dataSources.FillPostgresDSForm();
        dataSources.SaveDSFromDialog(true);

        // assert that datasource is saved and can be seen in active ds list
        AppSidebar.navigate(AppSidebarButton.Data);
        agHelper.AssertContains(dsName, "exist", dataSources._datasourceCard);

        // delete datasource
        dataSources.DeleteDatasourceFromWithinDS(dsName);
      });
    });

    it("3. Test to verify that Editing existing datasource, state of save button when new changes are made/not made.", () => {
      dataSources.NavigateToDSCreateNew();
      agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        dataSources.CreateDataSource("Postgres");

        // Edit Datasource, dont make new changes and check state of save
        dataSources.EditDatasource();
        agHelper.AssertElementEnabledDisabled(dataSources._saveDs, 0);

        // Make new changes and check state of datasource
        dataSources.FillPostgresDSForm(
          "Production",
          false,
          "username",
          "password",
        );
        agHelper.AssertElementEnabledDisabled(dataSources._saveDs, 0, false);
        dataSources.UpdateDatasource();

        // delete datasource
        cy.get("@dsName").then(($dsName) => {
          dsName = $dsName;
          dataSources.DeleteDatasourceFromWithinDS(dsName);
        });
      });
    });
  },
);
