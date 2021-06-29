describe("Name uniqueness test", function() {
  it("Test api name unique error", () => {
    cy.log("Login Successful");
    cy.NavigateToAPI_Panel();
    cy.log("Navigation to API Panel screen successful");
    cy.CreateAPI("Uni");
    cy.log("Creation of UniqueName Action successful");
    cy.CreationOfUniqueAPIcheck("Uni");
    //Download text when entered proper error message is not shown/ Also we will enable this test
    //once we have better way to handle entering longer names.
    //cy.CreationOfUniqueAPIcheck("download");
  });
});
