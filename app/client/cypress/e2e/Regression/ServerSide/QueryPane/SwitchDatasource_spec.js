const datasource = require("../../../../locators/DatasourcesEditor.json");
const queryLocators = require("../../../../locators/QueryEditor.json");
import { dataSources, agHelper } from "../../../../support/Objects/ObjectsCore";
describe("Switch datasource", function () {
  let postgresDatasourceName;
  let postgresDatasourceNameSecond;
  let mongoDatasourceName;
  let guid, dsName_1, dsName_2, MongoDB;
  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  it("1. Create postgres datasource", function () {
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("PostgreSQL");
      guid = uid.toLowerCase();
      agHelper.RenameWithInPane("Postgres_1_" + guid, false);
      dataSources.FillPostgresDSForm();
      dataSources.TestSaveDatasource();

      cy.wrap("Postgres_1_" + guid).as("dsName_1");
      cy.get("@dsName_1").then(($dsName) => {
        dsName_1 = $dsName;
      });
    });
  });
  it("2. Create another postgres datasource", function () {
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("PostgreSQL");
      guid = uid.toLowerCase();
      agHelper.RenameWithInPane("Postgres_2_" + guid, false);
      dataSources.FillPostgresDSForm();
      dataSources.TestSaveDatasource();

      cy.wrap("Postgres_2_" + guid).as("dsName_2");
      cy.get("@dsName_2").then(($dsName) => {
        dsName_2 = $dsName;
      });
    });
  });

  it("3. Create mongo datasource", function () {
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("Mongo");
      guid = uid.toLowerCase();
      agHelper.RenameWithInPane("Mongo" + guid, false);
      dataSources.FillMongoDSForm();
      dataSources.TestSaveDatasource();
      cy.wrap("Mongo" + guid).as("MongoDB");
      cy.get("@MongoDB").then(($dsName) => {
        MongoDB = $dsName;
      });
    });
  });

  it("4. By switching datasources execute a query with both the datasources", function () {
    dataSources.NavigateToActiveTab();
    dataSources.CreateQueryFromActiveTab(dsName_1);
    cy.get(".rc-select-show-arrow").click();
    cy.contains(".rc-select-item-option-content", dsName_2).click().wait(1000);
    cy.runQuery();
    // Confirm mongo datasource is not present in the switch datasources dropdown
    cy.get(".rc-select-show-arrow").click();
    cy.get(".rc-select-item-option-content").should("not.have", MongoDB);
  });

  it("5. Delete the query and datasources", function () {
    dataSources.DeleteQuery("Query1");
    cy.deleteDatasource(MongoDB);
    cy.deleteDatasource(dsName_1);
    cy.deleteDatasource(dsName_2);
  });
});
