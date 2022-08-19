import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let agHelper = ObjectsRegistry.AggregateHelper,
  locator = ObjectsRegistry.CommonLocators,
  apiPage = ObjectsRegistry.ApiPage;

const largeResponseApiUrl = "https://api.publicapis.org/entries";
//"https://jsonplaceholder.typicode.com/photos";//Commenting since this is faster sometimes & case is failing

const ERROR_ACTION_EXECUTE_FAIL = (actionName) =>
  `${actionName} action returned an error response`;

describe("Abort Action Execution", function() {
  it("1. #14006 - Cancel Request button should abort API action execution", function() {
    apiPage.CreateAndFillApi(largeResponseApiUrl);
    apiPage.RunAPI(false);
    agHelper.GetNClick(locator._cancelActionExecution);
    agHelper.ValidateToastMessage(ERROR_ACTION_EXECUTE_FAIL("Api1"));
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
