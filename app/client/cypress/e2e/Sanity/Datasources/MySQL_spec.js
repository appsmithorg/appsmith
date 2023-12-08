const datasource = require("../../../locators/DatasourcesEditor.json");
import { dataSources } from "../../../support/Objects/ObjectsCore";

let datasourceName;

describe("MySQL datasource test cases", function () {
  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  it("1. Create, test, save then delete a MySQL datasource", function () {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.MySQL).click();
    cy.fillMySQLDatasourceForm();
    cy.generateUUID().then((UUID) => {
      datasourceName = `MySQL MOCKDS ${UUID}`;
      cy.renameDatasource(datasourceName);
      cy.testSaveDatasource();
      dataSources.DeleteDatasourceFromWithinDS(datasourceName);
    });
  });

  it("2. Create with trailing white spaces in host address and database name, test, save then delete a MySQL datasource", function () {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.MySQL).click();
    cy.fillMySQLDatasourceForm(true);
    cy.generateUUID().then((UUID) => {
      datasourceName = `MySQL MOCKDS ${UUID}`;
      cy.renameDatasource(datasourceName);
    });
    cy.testSaveDatasource();
  });

  it("3. Create a new query from the datasource editor", function () {
    // cy.get(datasource.createQuery).click();
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
