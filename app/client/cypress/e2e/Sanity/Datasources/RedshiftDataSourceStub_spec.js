const datasource = require("../../../locators/DatasourcesEditor.json");
let datasourceName;
import { agHelper, dataSources } from "../../../support/Objects/ObjectsCore";
import { ObjectsRegistry } from "../../../support/Objects/Registry";
import { DataSources } from "../../../support/Pages/DataSources";

describe(
  "Redshift datasource test cases",
  {
    tags: ["@tag.Datasource", "@tag.Sanity", "@tag.Git", "@tag.AccessControl"],
  },
  function () {
    beforeEach(() => {
      dataSources.StartDataSourceRoutes();
    });

    it("1. Create, test, save then delete a Redshift datasource", function () {
      cy.NavigateToDatasourceEditor();
      cy.get(datasource.Redshift).click();
      cy.fillRedshiftDatasourceForm();
      cy.generateUUID().then((UUID) => {
        datasourceName = `Redshift MOCKDS ${UUID}`;
        cy.renameDatasource(datasourceName);
      });
      cy.testSaveDatasource(false);
    });

    it("2. Create with trailing white spaces in host address and database name, test, save then delete a Redshift datasource", function () {
      cy.NavigateToDatasourceEditor();
      cy.get(datasource.Redshift).click();
      cy.fillRedshiftDatasourceForm(true);
      cy.generateUUID().then((UUID) => {
        datasourceName = `Redshift MOCKDS ${UUID}`;
        cy.renameDatasource(datasourceName);
      });
      cy.testSaveDatasource(false);
      cy.deleteDatasource(datasourceName);
    });

    it("3. Create a new query from the datasource editor", function () {
      ObjectsRegistry.DataSources.CreateQueryForDS(datasourceName);
      cy.wait("@createNewApi").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        201,
      );
      cy.deleteQueryUsingContext();
      cy.deleteDatasource(datasourceName);
    });

    it("4. Verify the default port for the datasource", function () {
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("Redshift");

      agHelper.AssertAttribute(dataSources._port, "value", "5439");
    });
  },
);
