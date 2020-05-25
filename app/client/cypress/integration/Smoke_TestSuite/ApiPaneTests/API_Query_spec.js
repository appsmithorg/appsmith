const testdata = require("../../../fixtures/testdata.json");
const apiwidget = require("../../../locators/apiWidgetslocator.json");

describe("API Panel Test Functionality", function() {
  it("API check with query params test API fetaure", function() {
    cy.log("Login Successful");
    cy.NavigateToAPI_Panel();
    cy.log("Navigation to API Panel screen successful");
    cy.CreateAPI("FirstAPI");
    cy.log("Creation of FirstAPI Action successful");
    cy.EnterSourceDetailsWithQueryParam(
      testdata.baseUrl,
      testdata.methods,
      testdata.headerKey,
      testdata.headerValue,
      testdata.queryKey,
      testdata.queryValue,
    );
    cy.ResponseStatusCheck("200 OK");
    cy.log("Response code check successful");
    cy.ResponseCheck(testdata.responsetext3);
    cy.log("Response data check successful");
    cy.DeleteAPI();
    cy.CreateAPI("SecondAPI");
    cy.log("Creation of SecondAPI Action successful");
    cy.EnterSourceDetailsWithQueryParam(
      testdata.baseUrl,
      testdata.methods,
      testdata.headerKey,
      testdata.headerValueBlank,
      testdata.queryKey,
      testdata.queryValue,
    );
    cy.ResponseStatusCheck("5000");
    cy.log("Response code check successful");
    cy.ResponseCheck("Invalid value for Content-Type");
    cy.log("Response data check successful");
  });
});
