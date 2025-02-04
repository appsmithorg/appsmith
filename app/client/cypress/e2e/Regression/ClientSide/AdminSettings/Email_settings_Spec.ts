import {
  agHelper,
  adminSettings,
  homePage,
  inviteModal,
  appSettings,
  embedSettings,
} from "../../../../support/Objects/ObjectsCore";
import AdminsSettings from "../../../../locators/AdminsSettings";
import formWidgetsPage from "../../../../locators/FormWidgets.json";
import SignupPageLocators from "../../../../locators/SignupPage.json";
import { CURRENT_REPO, REPO } from "../../../../fixtures/REPO";
import homePageLocators from "../../../../locators/HomePage";

describe(
  "Admin Email Page - Email setting page validations",
  { tags: ["@tag.Settings", "@tag.Email"] },
  () => {
    const fromEmail = `sagar.${Math.random().toString(36).substring(2, 25)}@appsmith.com`;
    const POLL_INTERVAL = 5000;
    const TIMEOUT = 100000;
    const originUrl = Cypress.config("baseUrl");

    let workspaceName: string, applicationName: string;
    const emailOne = `sagarspec1.${Math.random().toString(36).substring(2, 25)}@appsmith.com`;
    const emailTwo = `sagarspec2.${Math.random().toString(36).substring(2, 25)}@appsmith.com`;
    const emailThree = `sagarspec3.${Math.random().toString(36).substring(2, 25)}@appsmith.com`;
    const emailFour = `sagarspec4.${Math.random().toString(36).substring(2, 25)}@appsmith.com`;
    const tempPassword = "testPassword";

    before(() => {
      cy.LogOut();
      cy.SignupFromAPI(emailOne, tempPassword);
      cy.LogOut();
      cy.SignupFromAPI(emailTwo, tempPassword);
      cy.LogOut();
      cy.SignupFromAPI(emailThree, tempPassword);
      cy.LogOut();
      cy.SignupFromAPI(emailFour, tempPassword);
      cy.LogOut();
    });

    it("1. Verify adding new admin user and sign up process", () => {
      cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      adminSettings.NavigateToAdminSettings();
      agHelper.AssertElementVisibility(AdminsSettings.LeftPaneBrandingLink);
      cy.get(AdminsSettings.addEmailGhostInput)
        .click({ force: true })
        .type(fromEmail);
      agHelper.ClickOutside();

      agHelper.GetNClick(AdminsSettings.saveButton, 0, true);
      cy.waitForServerRestart().then(() => {
        agHelper.WaitUntilEleAppear(homePage._profileMenu);
      });
      agHelper.AssertContains(
        fromEmail,
        "exist",
        formWidgetsPage.dropdownInput,
      );
      cy.SignupFromAPI(fromEmail, "testPassword");
      cy.LoginFromAPI(fromEmail, "testPassword");
    });

    it("2. Verify admin setup smtp and test email works", () => {
      agHelper.VisitNAssert(adminSettings.routes.APPLICATIONS);
      agHelper.CypressReload();
      const testEmailSubject: string = "Test email from Appsmith";
      const testEmailBody: string =
        "This is a test email from Appsmith, initiated from Admin Settings page. If you are seeing this, your email configuration is working!";
      adminSettings.NavigateToAdminSettings(false);
      agHelper.AssertElementVisibility(AdminsSettings.LeftPaneBrandingLink);
      agHelper.GetNClick(AdminsSettings.emailTab);

      cy.get(AdminsSettings.smtpAppsmithMailHostInput)
        .clear()
        .type("host.docker.internal")
        .invoke("val")
        .then((text) => {
          expect(text).to.equal("host.docker.internal");
        });

      cy.get(AdminsSettings.smtpAppsmithMailPortInput)
        .clear()
        .type("25")
        .invoke("val")
        .then((text) => {
          expect(text).to.equal("25");
        });

      cy.get(AdminsSettings.smtpAppsmithMailFromInput)
        .clear()
        .type(fromEmail)
        .invoke("val")
        .then((text) => {
          expect(text).to.equal(fromEmail);
        });

      cy.get(AdminsSettings.smtpAppsmithMailReplyToInput)
        .clear()
        .type(fromEmail)
        .invoke("val")
        .then((text) => {
          expect(text).to.equal(fromEmail);
        });

      cy.get(AdminsSettings.smtpAppsmithMailUserNameInput)
        .clear()
        .type("root")
        .invoke("val")
        .then((text) => {
          expect(text).to.equal("root");
        });

      cy.get(AdminsSettings.smtpAppsmithMailPasswordInput)
        .clear()
        .type("root")
        .invoke("val")
        .then((text) => {
          expect(text).to.equal("root");
        });
      cy.intercept("POST", "/api/v1/admin/send-test-email").as("sendTestEmail");
      agHelper.GetNClick(AdminsSettings.smtpAppsmithMailTestButton);
      cy.wait("@sendTestEmail").then((interception) => {
        expect(interception.response.statusCode).to.eq(200);
        cy.log(
          "Intercepted API Response:",
          JSON.stringify(interception.response.body),
        );
      });
      try {
        agHelper
          .waitForEmail({
            pollInterval: POLL_INTERVAL,
            timeout: TIMEOUT,
            targetSubject: testEmailSubject,
            targetEmail: fromEmail,
          })
          .then((email) => {
            if (email) {
              expect(email).to.exist;
              expect(email.headers.subject).to.equal(testEmailSubject);
              expect(email.headers.to).to.equal(fromEmail);
              expect(email.text.trim()).to.equal(testEmailBody);
            } else {
              cy.log("No email received, continuing test without failure.");
            }
          });
      } catch (error) {
        cy.log("Error occurred while fetching email:", error);
      }
      agHelper.GetNClick(AdminsSettings.saveButton, 0, true);
      cy.waitForServerRestart();
      agHelper.WaitUntilEleAppear(homePage._profileMenu);
    });

    it("3. To verify forget password email", () => {
      agHelper.VisitNAssert("/applications", "getAllWorkspaces");
      const resetPassSubject: string =
        CURRENT_REPO === REPO.EE
          ? "Reset your Appsmith password"
          : "Reset your Appsmith password";
      homePage.LogOutviaAPI();
      agHelper.VisitNAssert("/");
      agHelper.WaitUntilEleAppear(SignupPageLocators.forgetPasswordLink);

      agHelper.GetNClick(SignupPageLocators.forgetPasswordLink, 0, true);
      agHelper.GetElement(SignupPageLocators.username).type(emailOne);

      cy.intercept(
        {
          method: "POST",
          url: "/api/v1/users/forgotPassword", // Match the endpoint
        },
        (req) => {
          req.headers["Origin"] = originUrl.replace(/\/$/, "");
          req.continue();
        },
      ).as("forgotPasswordCall");

      agHelper.GetNClick(SignupPageLocators.submitBtn);

      // Wait for the intercepted request and validate
      cy.wait("@forgotPasswordCall").then((interception) => {
        if (interception.response) {
          expect(interception.response.statusCode).to.equal(200); // Ensure the response is successful
        } else {
          cy.log("Interception did not receive a response.");
        }
      });

      agHelper.AssertContains(
        `A password reset link has been sent to your email address ${emailOne} registered with Appsmith.`,
      );

      try {
        agHelper
          .waitForEmail({
            pollInterval: POLL_INTERVAL,
            timeout: TIMEOUT,
            targetSubject: resetPassSubject,
            targetEmail: emailOne,
          })
          .then((email) => {
            if (email) {
              expect(email).to.exist;
              expect(email.headers.subject).to.equal(resetPassSubject);
              expect(email.headers.to).to.equal(emailOne);

              const emailHtml = email.html; // Store the email HTML content
              const resetPasswordLinkMatch = emailHtml.match(
                /href="([^"]*resetPassword[^"]*)"/,
              );

              console.log("Reset Password data:", resetPasswordLinkMatch);

              if (resetPasswordLinkMatch) {
                const resetPasswordLink = resetPasswordLinkMatch[1]
                  .replace(new RegExp(`(${originUrl})(\\/+)`, "g"), "$1/")
                  .replace(/&#61;/g, "=");

                console.log("Reset Password Link:", resetPasswordLink);

                cy.visit(resetPasswordLink, { timeout: 60000 });
                agHelper.AssertContains("Reset password");
                agHelper.AssertContains("New password");
                agHelper
                  .GetElement(SignupPageLocators.password)
                  .type(tempPassword);
                agHelper.GetNClick(SignupPageLocators.submitBtn);
                agHelper.AssertContains("Your password has been reset");
              } else {
                cy.log("Reset password link not found in the email HTML");
              }
            } else {
              cy.log("No email found with subject:", resetPassSubject);
            }
          });
      } catch (error) {
        cy.log(
          "Error occurred while fetching the email or processing the reset password link:",
          error,
        );
      }
    });

    it("4. To verify invite workspace email", () => {
      agHelper.VisitNAssert(adminSettings.routes.APPLICATIONS);
      agHelper.CypressReload();
      const inviteEmailSubject: string =
        CURRENT_REPO === REPO.EE
          ? "You’re invited to the workspace"
          : "You’re invited to the Appsmith workspace";
      homePage.LogOutviaAPI();
      agHelper.VisitNAssert("/");
      agHelper.WaitUntilEleAppear(SignupPageLocators.forgetPasswordLink);
      agHelper.VisitNAssert(adminSettings.routes.APPLICATIONS);
      agHelper.CypressReload();
      cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      agHelper.VisitNAssert(adminSettings.routes.APPLICATIONS);
      if (CURRENT_REPO === REPO.EE) adminSettings.EnableGAC(false, true);
      agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        workspaceName = `workspace-${uid}`;
        applicationName = `application-${uid}`;
        homePage.CreateNewWorkspace(workspaceName, true);
        homePage.CreateAppInWorkspace(workspaceName, applicationName);
        homePage.NavigateToHome();
        homePage.InviteUserToWorkspace(workspaceName, emailTwo, "Developer");
      });
      homePage.LogOutviaAPI();
      agHelper.VisitNAssert("/");
      agHelper.WaitUntilEleAppear(SignupPageLocators.forgetPasswordLink);
      cy.LoginFromAPI(emailTwo, tempPassword);
      agHelper.VisitNAssert(adminSettings.routes.APPLICATIONS);
      try {
        agHelper
          .waitForEmail({
            pollInterval: POLL_INTERVAL,
            timeout: TIMEOUT,
            targetSubject: inviteEmailSubject,
            targetEmail: emailTwo,
          })
          .then((email) => {
            if (email) {
              expect(email).to.exist;
              expect(email.headers.subject).to.include(inviteEmailSubject);
              expect(email.headers.to).to.equal(emailTwo);

              const emailHtml = email.html; // Store the email HTML content
              const inviteLinkMatch = emailHtml.match(
                /href="([^"]*applications[^"]*)"/,
              ); // Extract the link using regex

              if (inviteLinkMatch) {
                const inviteLink = inviteLinkMatch[1].replace(
                  /([^:]\/)\/+/g,
                  "$1",
                );
                console.log("Invite workspace Link:", inviteLink);
                cy.visit(inviteLink, { timeout: 60000 });
                homePage.SelectWorkspace(workspaceName);
                agHelper.AssertContains(workspaceName);
                cy.get(homePageLocators.applicationCard)
                  .first()
                  .trigger("mouseover");
                agHelper.AssertElementExist(homePageLocators.appEditIcon);
              } else {
                cy.log("Invite workspace app link not found in the email HTML");
              }
            } else {
              cy.log("No email found with subject:", inviteEmailSubject);
            }
          });
      } catch (error) {
        cy.log(
          "Error occurred while fetching the email or processing the invite link:",
          error,
        );
      }
    });

    it("5. To verify application invite email with developer right", () => {
      agHelper.VisitNAssert(adminSettings.routes.APPLICATIONS);
      agHelper.CypressReload();
      const inviteEmailSubject: string =
        CURRENT_REPO === REPO.EE
          ? "You're invited to the app"
          : "You’re invited to the Appsmith workspace.";
      homePage.LogOutviaAPI();
      agHelper.VisitNAssert("/");
      agHelper.WaitUntilEleAppear(SignupPageLocators.forgetPasswordLink);
      cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      agHelper.VisitNAssert(adminSettings.routes.APPLICATIONS);
      if (CURRENT_REPO === REPO.EE) adminSettings.EnableGAC(false, true);
      agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        workspaceName = `workspace-${uid}`;
        applicationName = `application-${uid}`;
        homePage.CreateNewWorkspace(workspaceName);
        homePage.CreateAppInWorkspace(workspaceName, applicationName);
      });

      appSettings.OpenAppSettings();
      appSettings.GoToEmbedSettings();
      embedSettings.ToggleMarkForkable();
      embedSettings.TogglePublicAccess();

      inviteModal.OpenShareModal();
      homePage.InviteUserToApplication(emailThree, "Developer");
      homePage.LogOutviaAPI();
      agHelper.VisitNAssert("/");
      agHelper.WaitUntilEleAppear(SignupPageLocators.forgetPasswordLink);
      cy.LoginFromAPI(emailThree, tempPassword);
      agHelper.VisitNAssert(adminSettings.routes.APPLICATIONS);
      try {
        agHelper
          .waitForEmail({
            pollInterval: POLL_INTERVAL,
            timeout: TIMEOUT,
            targetSubject: inviteEmailSubject,
            targetEmail: emailThree,
          })
          .then((email) => {
            if (email) {
              console.log("Email:", email);
              expect(email).to.exist;
              expect(email.headers.subject).to.include(inviteEmailSubject);
              expect(email.headers.to).to.include(emailThree);

              const emailHtml = email.html; // Store the email HTML content

              // Match all href links inside the <body>
              const bodyMatch = emailHtml.match(
                /<body[^>]*>([\s\S]*?)<\/body>/i,
              );
              console.log("bodyMatch: ", bodyMatch);

              if (bodyMatch && bodyMatch[1]) {
                const bodyContent = bodyMatch[1];

                const inviteLinkMatch = bodyContent.match(
                  /href="https?:\/\/[^"]*"/,
                );
                console.log("inviteLinkMatch: ", inviteLinkMatch);

                if (inviteLinkMatch) {
                  const inviteLink = inviteLinkMatch[0]
                    .replace(/([^:]\/)\/+/g, "$1")
                    .replace(/href=|=|"|"/g, "");

                  console.log("Invite workspace Link:", inviteLink);
                  cy.visit(inviteLink, { timeout: 60000 });
                  homePage.SelectWorkspace(workspaceName);
                  agHelper.AssertContains(applicationName);
                  cy.get(homePageLocators.applicationCard)
                    .first()
                    .trigger("mouseover");
                  agHelper.AssertElementExist(homePageLocators.appEditIcon);
                  homePage.LogOutviaAPI();
                  agHelper.VisitNAssert("/");
                  agHelper.WaitUntilEleAppear(
                    SignupPageLocators.forgetPasswordLink,
                  );
                } else {
                  cy.log(
                    "Invite developer app link not found in the email HTML",
                  );
                }
              } else {
                cy.log("No body content found in the email HTML");
              }
            } else {
              cy.log("No email found with subject:", inviteEmailSubject);
            }
          });
      } catch (error) {
        cy.log(
          "Error occurred while fetching the email or processing the invite link:",
          error,
        );
      }
    });

    it("6. To verify application invite email with view right", () => {
      agHelper.VisitNAssert(adminSettings.routes.APPLICATIONS);
      agHelper.CypressReload();
      const inviteEmailSubject: string =
        CURRENT_REPO === REPO.EE
          ? "You're invited to the app"
          : "You’re invited to the Appsmith workspace.";
      homePage.LogOutviaAPI();
      agHelper.VisitNAssert("/");
      agHelper.WaitUntilEleAppear(SignupPageLocators.forgetPasswordLink);
      agHelper.VisitNAssert(adminSettings.routes.APPLICATIONS);
      cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));

      if (CURRENT_REPO === REPO.EE) adminSettings.EnableGAC(false, true);
      agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        workspaceName = `workspace-${uid}`;
        applicationName = `application-${uid}`;
        homePage.CreateNewWorkspace(workspaceName);
        homePage.CreateAppInWorkspace(workspaceName, applicationName);
      });

      appSettings.OpenAppSettings();
      appSettings.GoToEmbedSettings();
      embedSettings.ToggleMarkForkable();
      embedSettings.TogglePublicAccess();

      inviteModal.OpenShareModal();
      homePage.InviteUserToApplication(emailFour, "App Viewer");
      homePage.LogOutviaAPI();
      agHelper.VisitNAssert("/");
      agHelper.WaitUntilEleAppear(SignupPageLocators.forgetPasswordLink);
      cy.LoginFromAPI(emailFour, tempPassword);
      try {
        agHelper
          .waitForEmail({
            pollInterval: POLL_INTERVAL,
            timeout: TIMEOUT,
            targetSubject: inviteEmailSubject,
            targetEmail: emailFour,
          })
          .then((email) => {
            if (email) {
              console.log("Email:", email);
              if (email.headers.subject.includes(inviteEmailSubject)) {
                console.log("Subject matches:", email.headers.subject);
              } else {
                console.log("Subject does not match expected subject.");
              }

              if (email.headers.to && email.headers.to.includes(emailFour)) {
                console.log("Recipient matches:", email.headers.to);
              } else {
                console.log("Recipient does not match expected email.");
              }

              const emailHtml = email.html;

              const bodyMatch = emailHtml.match(
                /<body[^>]*>([\s\S]*?)<\/body>/i,
              );
              console.log("bodyMatch: ", bodyMatch);

              if (bodyMatch && bodyMatch[1]) {
                const bodyContent = bodyMatch[1];

                const inviteLinkMatch = bodyContent.match(
                  /href="https?:\/\/[^"]*"/,
                );
                console.log("inviteLinkMatch: ", inviteLinkMatch);

                if (inviteLinkMatch) {
                  const inviteLink = inviteLinkMatch[0]
                    .replace(/([^:]\/)\/+/g, "$1")
                    .replace(/href=|=|"|"/g, "");

                  console.log("Invite workspace Link:", inviteLink);
                  cy.visit(inviteLink, { timeout: 60000 });
                  homePage.SelectWorkspace(workspaceName);
                  agHelper.AssertContains(applicationName);
                  cy.get(homePageLocators.applicationCard)
                    .first()
                    .trigger("mouseover");
                  agHelper.AssertElementAbsence(homePageLocators.appEditIcon);
                } else {
                  cy.log("Invite viewer app link not found in the email HTML");
                }
              } else {
                cy.log("No body content found in the email HTML");
              }
            } else {
              cy.log("No email found with subject:", inviteEmailSubject);
            }
          });
      } catch (error) {
        const errorMessage =
          error.message ||
          "An unknown error occurred during email fetching or invite link processing.";
        const errorStack = error.stack || "No stack trace available.";

        cy.log(
          `Error occurred while fetching the email or processing the invite link: ${errorMessage}`,
        );
        cy.log(`Stack Trace: ${errorStack}`);
      }
    });
  },
);
