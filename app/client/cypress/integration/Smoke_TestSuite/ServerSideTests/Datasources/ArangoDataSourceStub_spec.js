const datasource = require("../../../../locators/DatasourcesEditor.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let agHelper = ObjectsRegistry.AggregateHelper,
  dataSources = ObjectsRegistry.DataSources;

describe("Arango datasource test cases", function() {
  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  it("1. Create, test, save then delete a Arango datasource", function() {
    dataSources.NavigateToDSCreateNew();
    dataSources.CreatePlugIn("ArangoDB");
    agHelper.RenameWithInPane("ArangoWithnoTrailing", false);
    cy.fillArangoDBDatasourceForm();
    cy.intercept("POST", "/api/v1/datasources/test", {
      fixture: "testAction.json",
    }).as("testDatasource");
    cy.testSaveDatasource(false);
    dataSources.DeleteDatasouceFromActiveTab("ArangoWithnoTrailing");
  });

  it("2. Create with trailing white spaces in host address and database name, test, save then delete a Arango datasource", function() {
    dataSources.NavigateToDSCreateNew();
    dataSources.CreatePlugIn("ArangoDB");
    agHelper.RenameWithInPane("ArangoWithTrailing", false);
    cy.fillArangoDBDatasourceForm(true);
    cy.intercept("POST", "/api/v1/datasources/test", {
      fixture: "testAction.json",
    }).as("testDatasource");
    cy.testSaveDatasource(false);
  });

  it("3. Create a new query from the datasource editor", function() {
    cy.get(datasource.createQuery)
      .last()
      .click();
    cy.wait("@createNewApi").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );
    cy.deleteQueryUsingContext();
    cy.deleteDatasource("ArangoWithTrailing");
  });

  it("4. Arango Default name change", () => {
    dataSources.NavigateToDSCreateNew();
    dataSources.CreatePlugIn("ArangoDB");
    agHelper
      .GetText(dataSources._databaseName, "val")
      .then(($dbName) => expect($dbName).to.eq("_system"));
    dataSources.SaveDSFromDialog(false);
  });
});
