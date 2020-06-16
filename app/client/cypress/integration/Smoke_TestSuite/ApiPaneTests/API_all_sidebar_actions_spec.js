describe("API Panel Test Functionality ", function() {
  it("Test API copy/Move/delete feature", function() {
    cy.log("Login Successful");
    cy.NavigateToAPI_Panel();
    cy.log("Navigation to API Panel screen successful");

    cy.CreateAPI("FirstAPI");
    cy.log("Creation of FirstAPI Action successful");

    cy.CopyAPIToHome("FirstAPI");
    cy.log("Copy successful");

    cy.MoveAPIToPage();
    cy.log("Move successful");

    cy.DeleteAPI("FirstAPI");
    cy.log("Delete successful");
  });
});
