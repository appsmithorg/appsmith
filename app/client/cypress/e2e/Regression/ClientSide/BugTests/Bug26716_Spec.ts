import {
  agHelper,
  dataSources,
  entityExplorer,
} from "../../../../support/Objects/ObjectsCore";
let dsName;

describe("Bug 26726: Datasource selected from entity explorer should be correctly highlighted", function () {
  it("1. Create users and movies mock datasources and switch between them through entity explorer, check the active state", function () {
    dataSources.CreateMockDB("Users");
    dataSources.CreateMockDB("Movies");
    dataSources.NavigateToDSCreateNew();
    dataSources.CreateDataSource("Postgres");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName + "";
      // Select Users
      entityExplorer.SelectEntityByName("Users", "Datasources");
      agHelper.Sleep(200);
      cy.get("[data-testid='t--entity-item-Users']").should(
        "have.class",
        "active",
      );

      // Switch to Movies
      entityExplorer.SelectEntityByName("Movies", "Datasources");
      agHelper.Sleep(200);
      cy.get("[data-testid='t--entity-item-Movies']").should(
        "have.class",
        "active",
      );

      // Switch to custom DS
      entityExplorer.SelectEntityByName(dsName, "Datasources");
      agHelper.Sleep(200);
      const testId = "t--entity-item-" + dsName;
      cy.get(`[data-testid='${testId}']`).should("have.class", "active");

      // Delete all datasources
      dataSources.DeleteDatasouceFromActiveTab("Users");
      dataSources.DeleteDatasouceFromActiveTab("Movies");
      dataSources.DeleteDatasouceFromActiveTab(dsName);
    });
  });
});
