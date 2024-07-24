describe("Password Reset Flow", () => {
  const loginUrl = "/user/login";
  const email = "majahar+12@gmail.com";
  const forgotPasswordClassName = ".sc-hoaEDx > .sc-lknQiW > .sc-bcXHqe";
  const emailPlaceholder = `[placeholder="Enter your email"]`;
  it("Should navigate to reset password page with the correct email", () => {
    cy.LogOut();

    cy.visit(loginUrl);

    cy.get(emailPlaceholder, { timeout: 5000 }).should("be.visible");

    cy.get(emailPlaceholder).type(email, {
      force: true,
    });

    cy.get(forgotPasswordClassName).click();

    cy.get(emailPlaceholder).should("have.value", email);
  });
});