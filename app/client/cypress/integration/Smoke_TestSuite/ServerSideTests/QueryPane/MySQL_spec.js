const datasource = require("../../../../locators/DatasourcesEditor.json");
const queryEditor = require("../../../../locators/QueryEditor.json");
const datasourceEditor = require("../../../../locators/DatasourcesEditor.json");

let datasourceName;

describe("Validate CRUD queries for MySQL along with UI flow verifications", function() {
  beforeEach(() => {
    cy.startRoutesForDatasource();
  });
  it("1. Describe Table", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasourceEditor.MySQL).click();
    cy.generateUUID().then((uid) => {
      datasourceName = uid;
      cy.get(".t--edit-datasource-name").click();
      cy.get(".t--edit-datasource-name input")
        .clear()
        .type(datasourceName, { force: true })
        .should("have.value", datasourceName)
        .blur();
      cy.getPluginFormsAndCreateDatasource();
      cy.fillMySQLDatasourceForm();
      cy.testSaveDatasource();
      cy.NavigateToActiveDSQueryPane(datasourceName);
    });
    cy.get(queryEditor.queryNameField).type("DescribeTableQuery");
    cy.get(queryEditor.templateMenu).click();
    // mySQL query to fetch data
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type("DESCRIBE users", {
        force: true,
        parseSpecialCharSequences: false,
      });
    cy.WaitAutoSave();
    cy.onlyQueryRun();
    cy.wait("@postExecute").then((xhr) => {
      const response = xhr.response;
      expect(response.body.responseMeta.status).to.eq(200);
      const bodyArr = response.body.data.body;
      cy.log(bodyArr);
      expect(bodyArr[0]).to.have.any.keys("Field");
    });
    cy.deleteQueryUsingContext();
    cy.deleteDatasource(datasourceName);
  });

  it("2. Desc Table", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasourceEditor.MySQL).click();
    cy.generateUUID().then((uid) => {
      datasourceName = uid;
      cy.get(".t--edit-datasource-name").click();
      cy.get(".t--edit-datasource-name input")
        .clear()
        .type(datasourceName, { force: true })
        .should("have.value", datasourceName)
        .blur();
      cy.getPluginFormsAndCreateDatasource();
      cy.fillMySQLDatasourceForm();
      cy.testSaveDatasource();
      cy.NavigateToActiveDSQueryPane(datasourceName);
    });
    cy.get(queryEditor.queryNameField).type("DescTableQuery");
    cy.get(queryEditor.templateMenu).click();
    // mySQL query to fetch data
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type("DESC users", {
        force: true,
        parseSpecialCharSequences: false,
      });
    cy.WaitAutoSave();
    cy.onlyQueryRun();
    cy.wait("@postExecute").then((xhr) => {
      const response = xhr.response;
      expect(response.body.responseMeta.status).to.eq(200);
      const bodyArr = response.body.data.body;
      cy.log(bodyArr);
      expect(bodyArr[0]).to.have.any.keys("Field");
    });
    cy.deleteQueryUsingContext();
    cy.deleteDatasource(datasourceName);
  });
});
