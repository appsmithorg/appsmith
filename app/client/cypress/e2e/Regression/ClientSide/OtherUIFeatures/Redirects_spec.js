describe("Check for redirects associated with auth pages", function () {
  it("1. Should redirect away from auth pages if already logged in", function () {
    const loginPageRoute = "/user/login";
    cy.visit(loginPageRoute, { timeout: 60000 });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);
    cy.location("pathname").should("not.equal", loginPageRoute);
  });
});
