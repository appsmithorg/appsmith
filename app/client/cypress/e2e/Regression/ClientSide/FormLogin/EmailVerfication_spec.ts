describe("Email verification", () => {
  it("Shows the email verification pending page correctly", () => {
    cy.LogOut();
    cy.visit("/user/verificationPending?email=test@appsmith.com");
    cy.wait(1000);
    cy.get("[data-testid='verification-pending']").matchImageSnapshot(
      "VerificationPendingScreen",
    );
  });
  it("Verification error pages", () => {
    const errorCode = {
      ALREADY_VERIFIED: "AE-EMV-4095",
      EXPIRED: "AE-EMV-4096",
      MISMATCH: "AE-EMV-4098",
      UNKNOWN: "UNKNOWN",
    };
    cy.visit(
      `/user/verify-error?email=abc&code=${errorCode.MISMATCH}&message=xyz`,
    );
    cy.wait(1000);
    cy.get("[data-testid='verification-error']").matchImageSnapshot(
      "WrongToken",
    );
    cy.visit(
      `/user/verify-error?email=abc&code=${errorCode.ALREADY_VERIFIED}&message=xyz`,
    );
    cy.wait(1000);
    cy.get("[data-testid='verification-error']").matchImageSnapshot(
      "Verified Token",
    );
    cy.visit(
      `/user/verify-error?email=abc&code=${errorCode.EXPIRED}&message=xyz`,
    );
    cy.wait(1000);
    cy.get("[data-testid='verification-error']").matchImageSnapshot(
      "Expired Token",
    );
    cy.visit(
      `/user/verify-error?email=abc&code=${errorCode.UNKNOWN}&message=xyz`,
    );
    cy.wait(1000);
    cy.get("[data-testid='verification-error']").matchImageSnapshot(
      "Unknown error",
    );
  });
});
