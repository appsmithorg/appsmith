/// <reference types="Cypress" />
const testdata = require("../../../fixtures/testdata.json");

describe("API Panel Test Functionality ", function() {
  it("Test GET Action for mock API with header", function() {
    cy.log("Login Successful");
    cy.viewport('macbook-15');
    cy.NavigateToAPI_Panel();
    cy.log("Navigation to API Panel screen successful");
    cy.CreateAPI("TestAPINew");
    cy.log("Creation of API Action successful");
    cy.EnterSourceDetailsWithHeader(testdata.baseUrl,testdata.methods,testdata.headerKey,testdata.headerValue);
    cy.ResponseStatusCheck(testdata.successStatusCode);
    cy.log("Response code check successful");
    cy.ResponseCheck(testdata.responsetext);
    cy.log("Response data check successful");
  });
});
