const datasource = require("../../../locators/DatasourcesEditor.json");
import { dataSources } from "../../../support/Objects/ObjectsCore";

describe(
  "MsSQL datasource test cases",
  {
    tags: ["@tag.Datasource", "@tag.Sanity", "@tag.Git", "@tag.AccessControl"],
  },
  function () {
    let datasourceName;

    it("1. Create, test, save then delete a MsSQL datasource", function () {
      cy.NavigateToDatasourceEditor();
      cy.get(datasource.MsSQL).click();
      cy.fillMsSQLDatasourceForm();
      cy.generateUUID().then((UUID) => {
        datasourceName = `MsSQL MOCKDS ${UUID}`;
        cy.renameDatasource(datasourceName);
        cy.testSaveDatasource(false);
        dataSources.DeleteDatasourceFromWithinDS(datasourceName);
      });
    });

    it("2. Create with trailing white spaces in host address and database name, test, save then delete a MsSQL datasource", function () {
      cy.NavigateToDatasourceEditor();
      cy.get(datasource.MsSQL).click();
      cy.fillMsSQLDatasourceForm(true);
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
  },
);
