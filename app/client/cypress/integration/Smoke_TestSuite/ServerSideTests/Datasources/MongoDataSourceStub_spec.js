const datasource = require("../../../../locators/DatasourcesEditor.json");
const queryLocators = require("../../../../locators/QueryEditor.json");
const plugins = require("../../../../fixtures/plugins.json");
let datasourceName;

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
    /*
    cy.NavigateToQueryEditor();

    cy.get("@createDatasource").then((httpResponse) => {
      datasourceName = "Untitled Datasource";

      cy.contains(".t--datasource-name", datasourceName)
        .first()
        .find(queryLocators.createQuery)
        .click();
    });

    cy.get("@getPluginForm").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.xpath('//div[contains(text(),"Form Input")]').click({ force: true });
    cy.xpath('//div[contains(text(),"Raw Input")]').click({ force: true });
    cy.get(queryLocators.templateMenu).click();
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type(`{"find": "listingsAndReviews","limit": 10}`, {
        parseSpecialCharSequences: false,
      });

    cy.EvaluateCurrentValue(`{"find": "listingsAndReviews","limit": 10}`);
    cy.runAndDeleteQuery();
  });
  /*
  it("Create, test, save then delete a firestore datasource", function () {
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

  it("Create, test, save then delete a amazon datasource", function () {
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
  */
  });
});
