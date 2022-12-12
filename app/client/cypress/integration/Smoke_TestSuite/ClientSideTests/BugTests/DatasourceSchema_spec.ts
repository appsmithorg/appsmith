import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const agHelper = ObjectsRegistry.AggregateHelper,
  dataSources = ObjectsRegistry.DataSources;

describe("Datasource form related tests", function() {
  it("1. Bug - 17238 Verify datasource structure refresh on save - invalid datasource", () => {
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      const guid = uid;
      const dataSourceName = "Postgres " + guid;
      cy.get(dataSources._dsEntityItem).click();
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("PostgreSQL");
      agHelper.RenameWithInPane(dataSourceName, false);
      dataSources.FillPostgresDSForm(false, "docker", "wrongPassword");
      dataSources.verifySchema(dataSourceName, "Failed to initialize pool");
      agHelper.GetNClick(dataSources._editButton)
      dataSources.updatePassword("docker");
      dataSources.verifySchema(dataSourceName, "public.", true);
      dataSources.DeleteDatasouceFromWinthinDS(dataSourceName);
    });
  });
});
