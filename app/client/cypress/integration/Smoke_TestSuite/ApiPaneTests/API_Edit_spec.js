const testdata = require("../../../fixtures/testdata.json");
const apiwidget = require("../../../locators/apiWidgetslocator.json");

describe("API Panel Test Functionality", function() {
  it("Test Search API fetaure", function() {
    cy.log("Login Successful");
    cy.NavigateToAPI_Panel();
    cy.log("Navigation to API Panel screen successful");
    cy.CreateAPI("FirstAPI");
    cy.log("Creation of FirstAPI Action successful");
    cy.enterDatasourceAndPath(testdata.baseUrl, testdata.methods);
    cy.SaveAndRunAPI();
    cy.validateRequest(testdata.baseUrl, testdata.methods, testdata.Get);
    cy.ResponseStatusCheck(testdata.successStatusCode);
    cy.get(apiwidget.createApiOnSideBar)
      .first()
      .click({ force: true });
    cy.SearchAPIandClick("FirstAPI");
    cy.EditApiName("SecondAPI");
    cy.ClearSearch();
    cy.SearchAPIandClick("SecondAPI");
    cy.DeleteAPI();
  });
});
