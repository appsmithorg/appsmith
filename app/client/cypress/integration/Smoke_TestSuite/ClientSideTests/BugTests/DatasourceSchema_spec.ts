import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const agHelper = ObjectsRegistry.AggregateHelper,
  dataSources = ObjectsRegistry.DataSources,
  ee = ObjectsRegistry.EntityExplorer;

let guid;
let dataSourceName: string;
describe("Datasource form related tests", function() {
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
      dataSources.verifySchema(dataSourceName, "Failed to initialize pool");
      agHelper.GetNClick(dataSources._editButton);
      dataSources.updatePassword("docker");
      dataSources.verifySchema(dataSourceName, "public.", true);
    });
  });

  it("2. Verify if schema was fetched once #18448", () => {
    agHelper.RefreshPage();
    cy.intercept("GET", dataSources._getStructureReq).as("getDSStructure");
    ee.ExpandCollapseEntity("Datasources");
    ee.ExpandCollapseEntity(dataSourceName);
    agHelper.Sleep(1500);
    cy.verifyCallCount(`@getDatasourceStructure`, 1);
    dataSources.DeleteDatasouceFromWinthinDS(dataSourceName);
  });
});
