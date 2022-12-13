import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let dsName: any;

const agHelper = ObjectsRegistry.AggregateHelper,
  dataSources = ObjectsRegistry.DataSources;

describe("Bug 18664: datasource unsaved changes popup shows even without changes", function() {
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
});
