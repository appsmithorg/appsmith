const testdata = require("../../../../fixtures/testdata.json");
const apiwidget = require("../../../../locators/apiWidgetslocator.json");

describe("API Panel Test Functionality", function() {
  it("Test Search API fetaure", function() {
    cy.log("Login Successful");
    cy.NavigateToAPI_Panel();
    cy.log("Navigation to API Panel screen successful");
    cy.CreateAPI("FirstAPI");
    cy.get(".CodeMirror-placeholder")
      .first()
      .should("have.text", "https://mock-api.appsmith.com/users");
    cy.log("Creation of FirstAPI Action successful");
    cy.enterDatasourceAndPath(testdata.baseUrl, testdata.methods);
    cy.SaveAndRunAPI();
    cy.validateRequest(
      "FirstAPI",
      testdata.baseUrl,
      testdata.methods,
      testdata.Get,
    );
    cy.ResponseStatusCheck(testdata.successStatusCode);
    cy.SearchEntityandOpen("FirstAPI");
    cy.EditApiName("SecondAPI");
    cy.ClearSearch();
    cy.SearchEntityandOpen("SecondAPI");
    cy.DeleteAPI();
    cy.ClearSearch();
  });

  it("Should not crash on key delete", function() {
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("CrashTestAPI");
    cy.SelectAction(testdata.postAction);
    cy.get(apiwidget.headerKey)
      .first()
      .click({ force: true })
      .type("{uparrow}", { parseSpecialCharSequences: true })
      .type("{ctrl}{shift}{downarrow}", { parseSpecialCharSequences: true })
      .type("{backspace}", { parseSpecialCharSequences: true });
    // assert so that this fails
    cy.get(apiwidget.headerKey).should("be.visible");
    cy.get(apiwidget.headerKey).should("have.value", "");
  });

  it("Should correctly parse query params", function() {
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("APIWithQueryParams");
    cy.enterDatasourceAndPath(testdata.baseUrl, testdata.methodWithQueryParam);
    cy.ValidateQueryParams({
      key: "q",
      value: "mimeType='application/vnd.google-apps.spreadsheet'",
    });
  });
});
