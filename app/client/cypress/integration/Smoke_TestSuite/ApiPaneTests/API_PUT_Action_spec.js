const testdata = require("../../../fixtures/testdata.json");
const apiwidget = require("../../../locators/apiWidgetslocator.json");

describe("API Panel Test Functionality", function() {
  it("PUT Action test API fetaure", function() {
    cy.log("Login Successful");
    cy.NavigateToAPI_Panel();
    cy.log("Navigation to API Panel screen successful");
    cy.CreateAPI("FirstAPI");
    cy.log("Creation of FirstAPI Action successful");
    cy.SelectAction(testdata.putAction);
    cy.EnterSourceDetailsWithbody(
      testdata.baseUrl2,
      testdata.methodput,
      testdata.headerKey,
      testdata.headerValue,
    );
    cy.readFile("cypress/fixtures/putjson.txt").then(json => {
      cy.log(json);
      cy.xpath(apiwidget.postbody)
        .click({ force: true })
        .focus()
        .type(json, { force: true });
    });
    cy.SaveAPI();
    cy.ResponseStatusCheck("200 OK");
    cy.log("Response code check successful");
    cy.ResponseCheck("updatedAt");
    cy.log("Response data check successful");
  });
});
