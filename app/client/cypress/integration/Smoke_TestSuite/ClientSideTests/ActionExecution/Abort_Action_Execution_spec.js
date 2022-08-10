const commonlocators = require("../../../../locators/commonlocators.json");
const queryLocators = require("../../../../locators/QueryEditor.json");
const datasource = require("../../../../locators/DatasourcesEditor.json");
const formControls = require("../../../../locators/FormControl.json");

const testApiUrl = "https://jsonplaceholder.typicode.com/photos";

const ERROR_ACTION_EXECUTE_FAIL = (actionName) =>
  `${actionName} action returned an error response`;

describe("Abort Action Execution", function() {
  it("Cancel Request button should abort API action execution", function() {
    cy.createAndFillApi(testApiUrl, "");
    cy.RunAPIWithoutWaitingForResolution();
    cy.get(commonlocators.cancelActionExecution).click();
    cy.VerifyErrorMsgPresence(ERROR_ACTION_EXECUTE_FAIL("Api1"));
  });

  // Queries were resolving quicker than we could cancel them
  // Commenting this out till we can find a query that resolves slow enough for us to cancel its execution.

  // it("Cancel Request button should abort Query action execution", function() {
  //   cy.NavigateToDatasourceEditor();
  //   cy.get(datasource.MongoDB).click();
  //   cy.fillMongoDatasourceForm();
  //   cy.testSaveDatasource();
  //   cy.get("@createDatasource").then(
  //     (httpResponse) => httpResponse.response.body.data.name,
  //   );
  //   cy.NavigateToQueryEditor();
  //   cy.NavigateToActiveTab();
  //   cy.get(queryLocators.createQuery)
  //     .last()
  //     .click();
  //   cy.get(queryLocators.queryNameField).type("AbortQuery");
  //   cy.ValidateAndSelectDropdownOption(
  //     formControls.commandDropdown,
  //     "Find Document(s)",
  //   );

  //   cy.typeValueNValidate("friends", formControls.mongoCollection);
  //   cy.typeValueNValidate("300", formControls.mongoFindLimit);
  //   cy.RunQueryWithoutWaitingForResolution();
  //   cy.get(commonlocators.cancelActionExecution).click();
  //   cy.VerifyErrorMsgPresence(ERROR_ACTION_EXECUTE_FAIL("AbortQuery"));
  // });
});
