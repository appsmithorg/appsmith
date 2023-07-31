describe("Email verification", () => {
  it("Shows the email verification pending page correctly", () => {
    cy.LogOut();
    cy.visit("/user/verificationPending?email=test@appsmith.com");
    cy.wait(1000);
    cy.matchImageSnapshot();
  });
  it("Handles verification", () => {
    const wrongToken = "wrongToken";
    const verifiedToken = "verifiedToken";
    const correctToken = "correctToken";
    cy.intercept(
      "POST",
      "/api/v1/users/verifyEmailVerificationToken",
      (req) => {
        if (req.body.token === wrongToken) {
          req.reply(400, {
            responseMeta: {
              success: false,
              error: {
                code: "AE-APP-4028",
              },
            },
          });
        }
        if (req.body.token === verifiedToken) {
          req.reply(400, {
            responseMeta: {
              success: false,
              error: {
                code: "AE-APP-4094",
              },
            },
          });
        }
        if (req.body.token === correctToken) {
          req.reply(200, {
            responseMeta: {
              success: true,
            },
          });
        }
      },
    ).as("EmailVerification");
    cy.visit(`/user/verify?email=abc&token=${wrongToken}`);
    cy.wait(1000);
    cy.matchImageSnapshot("WrongToken");
    cy.visit(`/user/verify?email=abc&token=${verifiedToken}`);
    cy.wait(1000);
    cy.matchImageSnapshot("Verified Token");
    cy.visit(`/user/verify?email=abc&token=${correctToken}`);
    cy.wait(1000);
    cy.matchImageSnapshot("Correct token");
  });
});
