const datasource = require("../../../locators/DatasourcesEditor.json");

import { agHelper, dataSources } from "../../../support/Objects/ObjectsCore";

let elasticSearchName;

describe(
  "Elastic search datasource tests",
  {
    tags: ["@tag.Datasource", "@tag.Sanity", "@tag.Git", "@tag.AccessControl"],
  },
  function () {
    beforeEach(() => {
      dataSources.StartDataSourceRoutes();
    });

    it("1. Create elastic search datasource", function () {
      cy.NavigateToDatasourceEditor();
      cy.get(datasource.ElasticSearch).trigger("click", { force: true });
      cy.generateUUID().then((uid) => {
        elasticSearchName = uid;
        cy.get(".t--edit-datasource-name").click();
        cy.get(".t--edit-datasource-name input")
          .clear()
          .type(elasticSearchName, { force: true })
          .should("have.value", elasticSearchName)
          .blur();
      });
      cy.fillElasticDatasourceForm();

      //once we have test values for elastic search we can test and save the datasources.
      // cy.testSaveDatasource();

      dataSources.SaveDSFromDialog(false);
    });

    it("2. Verify the default port for the datasource", function () {
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("Elasticsearch");

      agHelper.AssertAttribute(dataSources._port, "value", "9200");
    });
  },
);
