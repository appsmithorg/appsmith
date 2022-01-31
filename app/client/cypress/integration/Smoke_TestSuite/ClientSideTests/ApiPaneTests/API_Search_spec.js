const testdata = require("../../../../fixtures/testdata.json");

describe("API Panel Test Functionality ", function() {
  it("Test Search API fetaure", function() {
    cy.log("Login Successful");
    cy.NavigateToAPI_Panel();
    cy.log("Navigation to API Panel screen successful");
    cy.CreateAPI("FirstAPI");
    cy.RunAPI();
    cy.log("Creation of FirstAPI Action successful");
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("SecondAPI");
    cy.RunAPI();
    cy.log("Creation of SecondAPI Action successful");
    cy.get(".t--entity-name").contains("FirstAPI");
    cy.get(".t--entity-name").contains("SecondAPI");
  });
});
