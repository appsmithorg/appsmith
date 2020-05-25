/// <reference types="Cypress" />
const testdata = require("../../../fixtures/testdata.json");
const apiwidget = require("../../../locators/apiWidgetslocator.json");
describe("API Panel Test Functionality ", function() {
  it("Test Market place API by adding to a page", function() {
    cy.log("Login Successful");
    cy.NavigateToAPI_Panel();
    cy.wait("@getCategories");
    cy.wait("@getTemplateCollections");
    cy.wait("@get3PProviders");
    cy.wait("@getUser");
    cy.log("Navigation to API Panel screen successful");
    cy.get(apiwidget.marketPlaceapi)
      .first()
      .click();
    cy.wait("@get3PProviderTemplates");
    cy.wait("@getUser");
    cy.get(".apiName")
      .first()
      .invoke("text")
      .then(ApiName => {
        cy.get(apiwidget.addPageButton)
          .first()
          .click();
        const searchApiName = ApiName.replace(/\s/g, "");
        cy.log(searchApiName);
        cy.wait("@add3PApiToPage");
        cy.wait("@getActions");
        cy.SearchAPIandClick(searchApiName);
        cy.get(apiwidget.apidocumentaionLink)
          .invoke("text")
          .then(apidocumentation => {
            cy.log(apidocumentation);
            expect(apidocumentation).to.eq("API documentation");
          });
      });
  });
});
