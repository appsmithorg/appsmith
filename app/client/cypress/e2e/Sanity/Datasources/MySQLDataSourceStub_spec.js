const datasource = require("../../../locators/DatasourcesEditor.json");
import { dataSources } from "../../../support/Objects/ObjectsCore";

describe("MySQL datasource test cases", function () {
  let datasourceName;
  it("1. Create, test, save then delete a MySQL datasource", function () {
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
      dataSources.DeleteDatasourceFromWithinDS(datasourceName);
    });
  });

  it("2. Create with trailing white spaces in host address and database name, test, save then delete a MySQL datasource", function () {
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

  it("3. Create a new query from the datasource editor", function () {
    dataSources.CreateQueryAfterDSSaved();
    cy.wait("@createNewApi").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );
    cy.deleteQueryUsingContext();
    cy.deleteDatasource(datasourceName);
  });
});
