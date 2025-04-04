import adminsSettings from "../../../../locators/AdminsSettings";
import { adminSettings as adminSettingsHelper } from "../../../../support/Objects/ObjectsCore";

describe("Email verification", { tags: ["@tag.Visual"] }, () => {
  it("1. Shows the email verification pending page correctly", () => {
    cy.LogOut();
    cy.visit("/user/verificationPending?email=test@appsmith.com");
    cy.wait(1000);
    cy.get("[data-testid='verification-pending']").matchImageSnapshot(
      "VerificationPendingScreen",
    );
  });

  it("2. Verification error pages", () => {
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

  //Skipping since Server restart taking a lot of time
  it.skip("3. Email verification settings test", () => {
    cy.LogOut();
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.get(".admin-settings-menu-option").should("be.visible");
    cy.get(".admin-settings-menu-option").click();
    cy.url().should("contain", adminSettingsHelper.routes.PROFILE);
    cy.wait("@getEnvVariables");
    cy.get(adminsSettings.authenticationTab).click();
    cy.get(adminsSettings.formloginButton).click();
    // Assert verification is disabled
    cy.get(adminsSettings.enableEmailVerificationInput).should("be.disabled");
    // Assert callout
    //cy.get(adminsSettings.adminSettingsCallout).should("be.visible");
    // go to email settings
    cy.get(adminsSettings.emailTab).click();
    // add email settings
    cy.generateUUID().then((uuid) => {
      cy.get(adminsSettings.fromAddress).clear().type(`${uuid}@appsmith.com`);
    });
    // save
    cy.get(adminsSettings.saveButton).click();

    cy.waitForServerRestart();

    cy.waitUntil(() =>
      cy.contains("General", { timeout: 210000 }).should("be.visible"),
    ).then(() => {
      cy.wait("@getEnvVariables");
      cy.get(adminsSettings.authenticationTab).click();
      cy.get(adminsSettings.formloginButton).click();
      // Assert verification is enabled
      cy.get(adminsSettings.enableEmailVerificationInput).should(
        "not.be.disabled",
      );
      // Assert callout
      cy.get(adminsSettings.adminSettingsCallout).should("be.visible");
      // turn on setting
      cy.get(adminsSettings.enableEmailVerificationInput).click();
      // Assert callout
      cy.get(adminsSettings.adminSettingsCallout).should("be.visible");
      cy.get(adminsSettings.saveButton).click();
      cy.wait("@postTenantConfig").then((interception) => {
        expect(interception.request.body.enableEmailVerification).to.equal(
          true,
        );
      });
      cy.get(adminsSettings.emailTab).click();
      // remove email settings
      cy.get(adminsSettings.saveButton).click();
      cy.waitForServerRestart();

      cy.waitUntil(() =>
        cy.contains("General", { timeout: 180000 }).should("be.visible"),
      ).then(() => {
        cy.wait("@getEnvVariables");
        cy.get(adminsSettings.authenticationTab).click();
        cy.get(adminsSettings.formloginButton).click();
        // Assert verification is enabled
        cy.get(adminsSettings.enableEmailVerificationInput).should(
          "not.be.disabled",
        );
        // Assert callout
        cy.get(adminsSettings.adminSettingsCallout).should("be.visible");
        // turn off setting
        cy.get(adminsSettings.enableEmailVerificationInput).click();
        // assert verification is disabled
        cy.get(adminsSettings.enableEmailVerificationInput).should(
          "be.disabled",
        );
        // assert callout
        cy.get(adminsSettings.adminSettingsCallout).should("be.visible");
      });
    });
  });
});
