describe("Email verification", () => {
  it("Shows the email verification pending page correctly", () => {
    cy.LogOut();
    cy.visit("/user/verificationPending?email=test@appsmith.com");
    cy.matchImageSnapshot();
  });
});
