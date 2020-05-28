const testdata = require("../../../fixtures/testdata.json");
const apiwidget = require("../../../locators/apiWidgetslocator.json");

describe("API Panel Test Functionality", function() {
  it("Test Search API fetaure", function() {
    cy.log("Login Successful");
    cy.NavigateToAPI_Panel();
    cy.log("Navigation to API Panel screen successful");
    cy.CreateAPI("FirstAPI");
    cy.log("Creation of FirstAPI Action successful");
    cy.EnterSourceDetailsWithHeader(
      testdata.baseUrl2,
      testdata.methods1,
      testdata.headerKey,
      testdata.headerValue,
    );
    cy.ResponseStatusCheck(testdata.successStatusCode);
    cy.get(apiwidget.createApiOnSideBar)
      .first()
      .click({ force: true });
    cy.SearchAPIandClick("FirstAPI");
    cy.EditApiName("SecondAPI");
    cy.ClearSearch();
    cy.SearchAPIandClick("SecondAPI");
    //invalid api end point check
    cy.EditSourceDetail(testdata.baseUrl3, testdata.methods2);
    cy.ResponseStatusCheck("404 NOT_FOUND");
    cy.DeleteAPI();
  });
});
