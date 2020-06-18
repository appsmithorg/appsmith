describe("Name uniqueness test", function() {
  it("Test api name unique error", () => {
    cy.log("Login Successful");
    cy.NavigateToAPI_Panel();
    cy.log("Navigation to API Panel screen successful");
    cy.CreateAPI("UniqueName");
    cy.log("Creation of UniqueName Action successful");
    cy.CreationOfUniqueAPIcheck("UniqueName");
  });
});
