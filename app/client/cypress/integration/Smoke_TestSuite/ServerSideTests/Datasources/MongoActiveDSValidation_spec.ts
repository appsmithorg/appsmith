import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let guid: any, dsName: any;

let agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  dataSources = ObjectsRegistry.DataSources;

describe("Validate Mongo Query Active Ds Validation", () => {
  it("1. Create Mongo Datasource with Active query & verify its text", () => {
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("MongoDB");
      guid = uid;
      agHelper.RenameWithInPane("Mongo " + guid, false);
      dataSources.FillMongoDSForm();
      dataSources.TestSaveDatasource();
      cy.wrap("Mongo " + guid).as("dsName");
    });
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
      dataSources.NavigateFromActiveDS(dsName, true);
      dataSources.NavigateToActiveTab();
      agHelper
        .GetText(dataSources._queriesOnPageText(dsName))
        .then(($queryCount) =>
          expect($queryCount).to.eq("1 query on this page"),
        );

      ee.SelectEntityByName("Query1", "QUERIES/JS");
      agHelper.ActionContextMenuWithInPane("Delete");
      dataSources.DeleteDatasouceFromWinthinDS(dsName);
    });
  });
});
