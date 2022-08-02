import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let dsName: any;

let agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  dataSources = ObjectsRegistry.DataSources;

describe("Check datasource doc links", function() {
  it("1. Verify Postgres documentation opens", function() {
    dataSources.CreateDataSource("Postgres");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
      dataSources.CreateQuery(dsName);
      agHelper.GetNClick(dataSources._queryDoc);
      agHelper.AssertElementVisible(dataSources._globalSearchModal);
      agHelper.AssertElementVisible(
        dataSources._globalSearchInput("PostgreSQL"),
      );
    });
  });

  it("2. Verify Mongo documentation opens", function() {
    dataSources.CreateDataSource("Mongo");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
      dataSources.CreateQuery(dsName);
      agHelper.GetNClick(dataSources._queryDoc);
      agHelper.AssertElementVisible(dataSources._globalSearchModal);
      agHelper.AssertElementVisible(dataSources._globalSearchInput("MongoDB"));
    });
  });

  it("3. Verify MySQL documentation opens", function() {
    dataSources.CreateDataSource("MySql");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
      dataSources.CreateQuery(dsName);
      agHelper.GetNClick(dataSources._queryDoc);
      agHelper.AssertElementVisible(dataSources._globalSearchModal);
      agHelper.AssertElementVisible(dataSources._globalSearchInput("MySQL"));
    });
  });

  afterEach(() => {
    agHelper.Escape();
    agHelper.ActionContextMenuWithInPane("Delete");
    ee.ExpandCollapseEntity("DATASOURCES");
    ee.ActionContextMenuByEntityName(dsName, "Delete", "Are you sure?");
    agHelper.WaitUntilToastDisappear("deleted successfully");
  });
});
