const datasource = require("../../../locators/DatasourcesEditor.json");
import { agHelper, dataSources } from "../../../support/Objects/ObjectsCore";

describe(
  "MySQL datasource test cases",
  {
    tags: ["@tag.Datasource", "@tag.Sanity", "@tag.Git", "@tag.AccessControl"],
  },
  function () {
    let datasourceName;
    it("1. Create, test, save then delete a MySQL datasource", function () {
      cy.NavigateToDatasourceEditor();
      agHelper.GetNClick(datasource.MySQL);
      cy.fillMySQLDatasourceForm();
      cy.generateUUID().then((UUID) => {
        datasourceName = `MySQL MOCKDS ${UUID}`;
        cy.renameDatasource(datasourceName);
        cy.testSaveDatasource(false);
        dataSources.DeleteDatasourceFromWithinDS(datasourceName);
      });
    });

    it("2. Create with trailing white spaces in host address and database name, test, save then delete a MySQL datasource", function () {
      cy.NavigateToDatasourceEditor();
      agHelper.GetNClick(datasource.MySQL);
      cy.fillMySQLDatasourceForm(true);
      cy.testSaveDatasource(false);
      cy.get("@saveDatasource").then((httpResponse) => {
        datasourceName = JSON.stringify(
          httpResponse.response.body.data.name,
        ).replace(/['"]+/g, "");
      });
    });

    it("3. Create a new query from the datasource editor", function () {
      dataSources.CreateQueryAfterDSSaved();
      cy.wait("@createNewApi").then((interception) => {
        // Validates the value of source for action creation -
        // should be self here as the user explicitly triggered create action
        expect(interception.request.body.source).to.equal("SELF");
        expect(interception.response.body.responseMeta.status).to.equal(201);
      });
      cy.deleteQueryUsingContext();
      cy.deleteDatasource(datasourceName);
    });
  },
);
