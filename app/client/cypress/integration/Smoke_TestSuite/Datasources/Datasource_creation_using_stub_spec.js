const datasource = require("../../../locators/DatasourcesEditor.json");

describe("Create, test, save then delete a mongo datasource", function() {
  it("Create, test, save then delete a mongo datasource", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.MongoDB).click();
    cy.getPluginFormsAndCreateDatasource();
    cy.fillMongoDatasourceForm();
    cy.intercept("POST", "/api/v1/datasources/test", {
      fixture: "testAction.json",
    }).as("testDatasource");
    cy.intercept("PUT", "/api/v1/datasources/*", {
      fixture: "saveAction.json",
    }).as("saveDatasource");
    cy.get(".t--test-datasource").click();
    cy.wait("@testDatasource");
    cy.get(".t--save-datasource").click();
    cy.wait("@saveDatasource").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });

  it("Create, test, save then delete a firestore datasource", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.Firestore).click();
    cy.getPluginFormsAndCreateDatasource();
    cy.firestoreDatasourceForm();
    cy.intercept("POST", "/api/v1/datasources/test", {
      fixture: "testAction.json",
    }).as("testDatasource");
    cy.intercept("PUT", "/api/v1/datasources/*", {
      fixture: "saveAction.json",
    }).as("saveDatasource");
    cy.get(".t--test-datasource").click();
    cy.wait("@testDatasource");
    cy.get(".t--save-datasource").click();
    cy.wait("@saveDatasource").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });

  it("Create, test, save then delete a amazon datasource", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.AmazonS3).click();
    cy.getPluginFormsAndCreateDatasource();
    cy.amazonDatasourceForm();
    cy.intercept("POST", "/api/v1/datasources/test", {
      fixture: "testAction.json",
    }).as("testDatasource");
    cy.intercept("PUT", "/api/v1/datasources/*", {
      fixture: "saveAction.json",
    }).as("saveDatasource");
    cy.get(".t--test-datasource").click();
    cy.wait("@testDatasource");
    cy.get(".t--save-datasource").click();
    cy.wait("@saveDatasource").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });
});
