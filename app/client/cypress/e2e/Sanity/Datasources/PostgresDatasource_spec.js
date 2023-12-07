const datasource = require("../../../locators/DatasourcesEditor.json");
import { dataSources } from "../../../support/Objects/ObjectsCore";
let datasourceName;

describe("Postgres datasource test cases", function () {
  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  it("1. Create, test, save then delete a postgres datasource", function () {
    dataSources.CreateDataSource("Postgres");
    cy.get("@saveDatasource").then((httpResponse) => {
      datasourceName = JSON.stringify(httpResponse.response.body.data.name);
      dataSources.DeleteDatasourceFromWithinDS(
        datasourceName.replace(/['"]+/g, ""),
      );
    });
  });

  it("2. Create with trailing white spaces in host address and database name, test, save then delete a postgres datasource", function () {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.PostgreSQL).click({ force: true });
    cy.fillPostgresDatasourceForm(true);
    cy.testSaveDatasource();
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
