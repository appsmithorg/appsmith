const testdata = require("../../../../fixtures/testdata.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const agHelper = ObjectsRegistry.AggregateHelper,
  dataSources = ObjectsRegistry.DataSources;

describe("Datasource form related tests", function() {
    
  it("1. Verify datasource structure refresh on save", () => {
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      const guid = uid;
      const dataSourceName = "Postgres " + guid;
      cy.get(dataSources._dsEntityItem).click();
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("PostgreSQL");
      agHelper.RenameWithInPane(dataSourceName, false);
      dataSources.FillPostgresDSForm(false, "docker", "wrongPassword");
      dataSources.verifySchema("Failed to initialize pool");
      cy.get(dataSources._activeDS)
        .contains(dataSourceName)
        .click();
      dataSources.updatePassword("docker");
      dataSources.verifySchema("public.");
      dataSources.DeleteDatasouceFromActiveTab(dataSourceName);
    });
  });
});
