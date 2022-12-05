const datasource = require("../../../../locators/DatasourcesEditor.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const agHelper = ObjectsRegistry.AggregateHelper,
  dataSources = ObjectsRegistry.DataSources;

let guid;
let dataSourceName: string;
describe("Datasource form related tests", () => {
  it("1. Verify datasource structure refresh on save - invalid datasource", () => {
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      guid = uid;
      dataSourceName = "Postgres " + guid;
      cy.get(dataSources._dsEntityItem).click();
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("PostgreSQL");
      agHelper.RenameWithInPane(dataSourceName, false);
      dataSources.FillPostgresDSForm(false, "docker", "wrongPassword");
      dataSources.verifySchema("Failed to initialize pool");
      cy.get(datasource.editDatasource).click();
      dataSources.updatePassword("docker");
      dataSources.verifySchema("public.", true);
    });
  });
  
  it("2. Verify if schema was fetched once #18448", () => {
    agHelper.RefreshPage();
    cy.intercept("GET", dataSources._getStructureReq).as("getDSStructure");
    cy.get(dataSources._dsEntityItem).click();
    cy.get(dataSources.getDSEntity(dataSourceName))
      .children(dataSources._entityCollapseButton)
      .click({ force: true });
    cy.wait(2000);
    cy.verifyCallCount(`@getDatasourceStructure`, 1);
    dataSources.DeleteDatasouceFromWinthinDS(dataSourceName);
  });
});
