import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const agHelper = ObjectsRegistry.AggregateHelper,
  dataSources = ObjectsRegistry.DataSources,
  ee = ObjectsRegistry.EntityExplorer;

let guid;
let dataSourceName: string;
describe("Datasource form related tests", function () {
  it("1. Bug - 17238 Verify datasource structure refresh on save - invalid datasource", () => {
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      guid = uid;
      dataSourceName = "Postgres " + guid;
      ee.ExpandCollapseEntity("Datasources");
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("PostgreSQL");
      agHelper.RenameWithInPane(dataSourceName, false);
      dataSources.FillPostgresDSForm(false, "docker", "wrongPassword");
      dataSources.VerifySchema(
        dataSourceName,
        "An exception occurred while creating connection pool.",
      );
      agHelper.GetNClick(dataSources._editButton);
      dataSources.UpdatePassword("docker");
      dataSources.VerifySchema(dataSourceName, "public.", true);
      agHelper.GetNClick(dataSources._createQuery);
    });
  });

  it("2. Verify if schema was fetched once #18448", () => {
    agHelper.RefreshPage();
    ee.ExpandCollapseEntity("Datasources");
    ee.ExpandCollapseEntity(dataSourceName, false);
    cy.intercept("GET", dataSources._getStructureReq).as("getDSStructure");
    ee.ExpandCollapseEntity("Datasources");
    ee.ExpandCollapseEntity(dataSourceName);
    agHelper.Sleep(1500);
    agHelper.VerifyCallCount(`@getDatasourceStructure`, 1);
    dataSources.DeleteQuery("Query1");
    dataSources.DeleteDatasouceFromWinthinDS(dataSourceName);
  });

  // keeping this here till we can establish A/B testing on cypress
  // it("3. Verify if schema exist in query editor", () => {
  //   dataSources.CreateMockDB("Users");
  //   dataSources.CreateQueryAfterDSSaved();
  //   dataSources.VerifyTableSchemaOnQueryEditor("public.users");
  // });
});
