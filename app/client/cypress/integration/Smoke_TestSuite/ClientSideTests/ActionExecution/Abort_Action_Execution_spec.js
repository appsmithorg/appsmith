const commonlocators = require("../../../../locators/commonlocators.json");
const queryLocators = require("../../../../locators/QueryEditor.json");
const datasource = require("../../../../locators/DatasourcesEditor.json");

const testApiUrl = "https://jsonplaceholder.typicode.com/photos";

const ERROR_ACTION_EXECUTE_FAIL = (actionName) =>
  `${actionName} action returned an error response`;

describe("Abort Action Execution", function() {
  it("Cancel Request button should abort action execution", function() {
    cy.createAndFillApi(testApiUrl, "");
    cy.RunAPIWithoutWaitingForResolution();
    cy.get(commonlocators.cancelActionExecution).click();
    cy.VerifyErrorMsgPresence(ERROR_ACTION_EXECUTE_FAIL("Api1"));
  });

  it("Cancel Request button should abort action execution", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.MongoDB).click();
    cy.fillMongoDatasourceForm();
    cy.testSaveDatasource();
    cy.get("@createDatasource").then(
      (httpResponse) => httpResponse.response.body.data.name,
    );
    cy.NavigateToQueryEditor();
    cy.NavigateToActiveTab();
    cy.get(queryLocators.createQuery)
      .last()
      .click();
    cy.get(queryLocators.queryNameField).type("AbortQuery");
    cy.RunQueryWithoutWaitingForResolution();
    cy.get(commonlocators.cancelActionExecution).click();
    cy.VerifyErrorMsgPresence(ERROR_ACTION_EXECUTE_FAIL("Query1"));
  });
});
