describe("Name uniqueness test", function() {
  it("Test api name unique error", () => {
    cy.log("Login Successful");
    cy.NavigateToAPI_Panel();
    cy.log("Navigation to API Panel screen successful");
    cy.CreateAPI("Uni");
    cy.log("Creation of UniqueName Action successful");
  });

  it("Validate Unique Name", () => {
    cy.CreationOfUniqueAPIcheck("Uni");
  });

  it("Validate download apiname check", () => {
    cy.CreationOfUniqueAPIcheck("download");
  });

  it("Validate dedicated worker scope object property(Blob)apiname check", () => {
    cy.CreationOfUniqueAPIcheck("Blob");
  });
});
