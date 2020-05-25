const testdata = require("../../../fixtures/testdata.json");
const apiwidget = require("../../../locators/apiWidgetslocator.json");

describe("API Panel Test Functionality", function() {
  it("Post Action test API fetaure", function() {
    cy.log("Login Successful");
    cy.NavigateToAPI_Panel();
    cy.log("Navigation to API Panel screen successful");
    cy.CreateAPI("FirstAPI");
    cy.log("Creation of FirstAPI Action successful");
    cy.SelectAction(testdata.postAction);
    cy.EnterSourceDetailsWithbody(
      testdata.baseUrl2,
      testdata.methodpost,
      testdata.headerKey,
      testdata.headerValue,
    );
    cy.readFile("cypress/fixtures/postjson.txt").then(json => {
      cy.log(json);
      cy.xpath(apiwidget.postbody)
        .click({ force: true })
        .focus()
        .type(json, { force: true });
    });
    cy.SaveAPI();
    cy.ResponseStatusCheck("201 CREATED");
    cy.log("Response code check successful");
    cy.ResponseCheck("createdAt");
    cy.log("Response data check successful");
  });
});
