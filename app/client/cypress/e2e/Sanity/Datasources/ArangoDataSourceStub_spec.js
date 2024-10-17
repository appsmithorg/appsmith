import { agHelper, dataSources } from "../../../support/Objects/ObjectsCore";

describe(
  "Arango datasource test cases",
  { tags: ["@tag.Datasource", "@tag.Sanity", "@tag.Git", "@tag.AccessControl"] },
  function () {
    it("1. Create, test, save then delete a Arango datasource", function () {
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("ArangoDB");
      agHelper.RenameWithInPane("ArangoWithnoTrailing", false);
      cy.fillArangoDBDatasourceForm();
      cy.intercept("POST", "/api/v1/datasources/test", {
        fixture: "testAction.json",
      }).as("testDatasource");
      cy.testSaveDatasource(false);
      dataSources.DeleteDatasourceFromWithinDS("ArangoWithnoTrailing");
    });

    it("2. Create with trailing white spaces in host address and database name, test, save then delete a Arango datasource", function () {
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("ArangoDB");
      agHelper.RenameWithInPane("ArangoWithTrailing", false);
      cy.fillArangoDBDatasourceForm(true);
      cy.intercept("POST", "/api/v1/datasources/test", {
        fixture: "testAction.json",
      }).as("testDatasource");
      cy.testSaveDatasource(false);
    });

    it("3. Create a new query from the datasource editor", function () {
      dataSources.CreateQueryAfterDSSaved();
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
      dataSources.FillArangoDSForm();
      agHelper
        .GetText(dataSources._databaseName, "val")
        .then(($dbName) => expect($dbName).to.eq("_system"));
      dataSources.SaveDSFromDialog(false);
    });

    it("5. Verify the default port for the datasource", function () {
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("ArangoDB");

      agHelper.AssertAttribute(dataSources._port, "value", "8529");
    });
  },
);
