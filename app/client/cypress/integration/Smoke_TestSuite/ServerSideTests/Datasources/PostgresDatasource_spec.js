const datasource = require("../../../../locators/DatasourcesEditor.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let dataSource = ObjectsRegistry.DataSources;
let datasourceName;

describe("Postgres datasource test cases", function() {
  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  it("1. Create, test, save then delete a postgres datasource", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.PostgreSQL).click();
    cy.fillPostgresDatasourceForm();
    cy.testSaveDatasource();
    cy.get("@saveDatasource").then((httpResponse) => {
      datasourceName = JSON.stringify(httpResponse.response.body.data.name);
      dataSource.DeleteDatasouceFromActiveTab(
        datasourceName.replace(/['"]+/g, ""),
      );
    });
  });

  it("2. Create with trailing white spaces in host address and database name, test, save then delete a postgres datasource", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.PostgreSQL).click();
    cy.fillPostgresDatasourceForm(true);
    cy.testSaveDatasource();
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
