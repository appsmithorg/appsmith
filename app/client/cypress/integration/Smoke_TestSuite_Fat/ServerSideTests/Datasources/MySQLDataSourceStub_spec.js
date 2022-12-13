const datasource = require("../../../../locators/DatasourcesEditor.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";
let dataSource = ObjectsRegistry.DataSources;

let datasourceName;

describe("MySQL datasource test cases", function() {
  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  it("1. Create, test, save then delete a MySQL datasource", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.MySQL).click();
    cy.fillMySQLDatasourceForm();
    cy.generateUUID().then((UUID) => {
      datasourceName = `MySQL MOCKDS ${UUID}`;
      cy.renameDatasource(datasourceName);
      cy.intercept("POST", "/api/v1/datasources/test", {
        fixture: "testAction.json",
      }).as("testDatasource");
      cy.testSaveDatasource(false);
      dataSource.DeleteDatasouceFromActiveTab(datasourceName);
    });
  });

  it("2. Create with trailing white spaces in host address and database name, test, save then delete a MySQL datasource", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.MySQL).click();
    cy.fillMySQLDatasourceForm(true);
    cy.intercept("POST", "/api/v1/datasources/test", {
      fixture: "testAction.json",
    }).as("testDatasource");
    cy.testSaveDatasource(false);
    cy.get("@saveDatasource").then((httpResponse) => {
      datasourceName = JSON.stringify(
        httpResponse.response.body.data.name,
      ).replace(/['"]+/g, "");
    });
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
    cy.deleteDatasource(datasourceName);
  });
});
