describe("API Panel Test Functionality ", function() {
  it("Test API copy/Move/delete feature", function() {
    cy.log("Login Successful");
    cy.NavigateToAPI_Panel();
    cy.log("Navigation to API Panel screen successful");

    cy.CreateAPI("FirstAPI");
    cy.log("Creation of FirstAPI Action successful");

    cy.CopyAPIToHome("FirstAPI");
    cy.DeleteAPI("FirstAPI");
    //cy.MoveAPIToPage();
    cy.CreateAPI("FirstAPI");
    cy.log("Creation of FirstAPI Action successful");
    cy.CreationOfUniqueAPIcheck("FirstAPI");
  });
});
