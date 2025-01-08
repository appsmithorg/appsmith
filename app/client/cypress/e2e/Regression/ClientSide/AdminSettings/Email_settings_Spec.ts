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
  { tags: ["@tag.Settings"] },
  () => {
    const randomString = Math.random().toString(36).substring(2, 10);
    const fromEmail = `sagar.${randomString}@appsmith.com`;
    const POLL_INTERVAL = 5000;
    const TIMEOUT = 80000;
    const resetPassSubject: string = "Reset your Appsmith password";
    const testEmailSubject: string = "Test email from Appsmith";
    const testEmailBody: string =
      "This is a test email from Appsmith, initiated from Admin Settings page. If you are seeing this, your email configuration is working!";
    const originUrl = Cypress.config("baseUrl");
    const inviteEmailSubject: string =
      "You’re invited to the Appsmith workspace.";
    let workspaceName: string, applicationName: string;

    it("1. Verify adding new admin user and sign up process", () => {
      cy.LogOut();
      cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      adminSettings.NavigateToAdminSettings();
      agHelper.AssertElementVisibility(AdminsSettings.LeftPaneBrandingLink);
      cy.get(AdminsSettings.addEmailGhostInput)
        .click({ force: true })
        .type(fromEmail);
      agHelper.ClickOutside();

      agHelper.GetNClick(AdminsSettings.saveButton, 0, true);
      cy.waitForServerRestart();
      agHelper.AssertContains(
        fromEmail,
        "exist",
        formWidgetsPage.dropdownInput,
      );
      cy.SignupFromAPI(fromEmail, "testPassword");

      cy.LoginFromAPI(fromEmail, "testPassword");
    });

    it("2. Verify admin setup smtp and test email works", () => {
      agHelper.RefreshPage();
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

      agHelper.GetNClick(AdminsSettings.smtpAppsmithMailTestButton);
      agHelper
        .waitForEmail({
          pollInterval: POLL_INTERVAL,
          timeout: TIMEOUT,
          targetSubject: testEmailSubject,
          targetEmail: fromEmail,
        })
        .then((email) => {
          expect(email).to.exist;
          expect(email.headers.subject).to.equal(testEmailSubject);
          expect(email.headers.to).to.equal(fromEmail);
          expect(email.text.trim()).to.equal(testEmailBody);
        });
      agHelper.GetNClick(AdminsSettings.saveButton, 0, true);
      cy.waitForServerRestart();
    });

    it("3. To verify forget password email", () => {
      cy.LogOut();
      cy.LoginFromAPI(
        Cypress.env("TESTUSERNAME3"),
        Cypress.env("TESTPASSWORD3"),
      );
      agHelper.RefreshPage();
      homePage.LogOutviaAPI();
      cy.reload();
      agHelper.GetNClick(SignupPageLocators.forgetPasswordLink, 0, true);
      agHelper
        .GetElement(SignupPageLocators.username)
        .type(Cypress.env("TESTUSERNAME3"));

      cy.intercept(
        {
          method: "POST",
          url: "/api/v1/users/forgotPassword", // Match the endpoint
        },
        (req) => {
          req.headers["Origin"] = originUrl;
          req.continue();
        },
      ).as("forgotPasswordCall");

      agHelper.GetNClick(SignupPageLocators.submitBtn);

      // Wait for the intercepted request and validate
      cy.wait("@forgotPasswordCall").then((interception) => {
        if (interception.response) {
          expect(interception.response.statusCode).to.equal(200); // Ensure the response is successful
        } else {
          throw new Error("Interception did not receive a response.");
        }
      });

      agHelper.AssertContains(
        `A password reset link has been sent to your email address ${Cypress.env("TESTUSERNAME3")} registered with Appsmith.`,
      );

      cy.request({
        method: "POST",
        url: "/api/v1/users/forgotPassword",
        headers: {
          "X-Requested-By": "Appsmith",
          Origin: originUrl,
        },
        body: {
          email: Cypress.env("TESTUSERNAME3"),
        },
        failOnStatusCode: true,
      }).then((response) => {
        console.log("Forget Response:", response);
      });
      agHelper
        .waitForEmail({
          pollInterval: POLL_INTERVAL,
          timeout: TIMEOUT,
          targetSubject: resetPassSubject,
          targetEmail: Cypress.env("TESTUSERNAME3"),
        })
        .then((email) => {
          expect(email).to.exist;
          expect(email.headers.subject).to.equal(resetPassSubject);
          expect(email.headers.to).to.equal(Cypress.env("TESTUSERNAME3"));

          const emailHtml = email.html; // Store the email HTML content
          const resetPasswordLinkMatch = emailHtml.match(
            /href="([^"]*resetPassword[^"]*)"/,
          );

          if (resetPasswordLinkMatch) {
            const resetPasswordLink = resetPasswordLinkMatch[1].replace(
              /([^:]\/)\/+/g,
              "$1",
            );
            console.log("Reset Password Link:", resetPasswordLink);
            cy.visit(resetPasswordLink, { timeout: 60000 });
            agHelper.AssertContains("Reset password");
            agHelper.AssertContains("New password");
            agHelper
              .GetElement(SignupPageLocators.password)
              .type(Cypress.env("TESTPASSWORD3"));
            agHelper.GetNClick(SignupPageLocators.submitBtn);
            agHelper.AssertContains("Your password has been reset");
          } else {
            throw new Error("Reset password link not found in the email HTML");
          }
        });
      cy.LoginFromAPI(
        Cypress.env("TESTUSERNAME3"),
        Cypress.env("TESTPASSWORD3"),
      );
    });

    it("4. To verify invite workspace email", () => {
      cy.LogOut();
      cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      if (CURRENT_REPO === REPO.EE) adminSettings.EnableGAC(false, true);
      agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        workspaceName = `workspace-${uid}`;
        applicationName = `application-${uid}`;
        homePage.CreateNewWorkspace(workspaceName, true);
        homePage.CreateAppInWorkspace(workspaceName, applicationName);
        homePage.NavigateToHome();
        homePage.InviteUserToWorkspace(
          workspaceName,
          Cypress.env("TESTUSERNAME2"),
          "Developer",
        );
      });
      agHelper
        .waitForEmail({
          pollInterval: POLL_INTERVAL,
          timeout: TIMEOUT,
          targetSubject: inviteEmailSubject,
          targetEmail: Cypress.env("TESTUSERNAME2"),
        })
        .then((email) => {
          expect(email).to.exist;
          expect(email.headers.subject).to.include(inviteEmailSubject);
          expect(email.headers.to).to.equal(Cypress.env("TESTUSERNAME2"));

          const emailHtml = email.html; // Store the email HTML content
          const inviteLinkMatch = emailHtml.match(
            /href="([^"]*applications[^"]*)"/,
          ); // Extract the link using regex

          if (inviteLinkMatch) {
            cy.LogOut();
            cy.LoginFromAPI(
              Cypress.env("TESTUSERNAME2"),
              Cypress.env("TESTPASSWORD2"),
            );
            const inviteLink = inviteLinkMatch[1].replace(/([^:]\/)\/+/g, "$1");
            console.log("Invite workspace Link:", inviteLink);
            cy.visit(inviteLink, { timeout: 60000 });
            homePage.SelectWorkspace(workspaceName);
            agHelper.AssertContains(workspaceName);
            cy.get(homePageLocators.applicationCard)
              .first()
              .trigger("mouseover");
            agHelper.AssertElementExist(homePageLocators.appEditIcon);
          } else {
            throw new Error(
              "Invite workspace app link not found in the email HTML",
            );
          }
        });
    });

    it("5. To verify application invite email with developer right", () => {
      cy.LogOut();
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
      homePage.InviteUserToApplication(
        Cypress.env("TESTUSERNAME1"),
        "Developer",
      );
      cy.LogOut();
      agHelper
        .waitForEmail({
          pollInterval: POLL_INTERVAL,
          timeout: TIMEOUT,
          targetSubject: inviteEmailSubject,
          targetEmail: Cypress.env("TESTUSERNAME1"),
        })
        .then((email) => {
          console.log("Email:", email);
          expect(email).to.exist;
          expect(email.headers.subject).to.include(inviteEmailSubject);
          expect(email.headers.to).to.equal(Cypress.env("TESTUSERNAME1"));

          const emailHtml = email.html; // Store the email HTML content

          console.log("workspaceName: ", workspaceName);

          const inviteLinkMatch = emailHtml.match(
            /href="([^"]*applications[^"]*)"/,
          ); // Extract the link using regex

          if (inviteLinkMatch) {
            cy.LoginFromAPI(
              Cypress.env("TESTUSERNAME1"),
              Cypress.env("TESTPASSWORD1"),
            );
            const inviteLink = inviteLinkMatch[1].replace(/([^:]\/)\/+/g, "$1");
            cy.visit(inviteLink, { timeout: 60000 });
            homePage.SelectWorkspace(workspaceName);
            agHelper.AssertContains(workspaceName);
            cy.get(homePageLocators.applicationCard)
              .first()
              .trigger("mouseover");
            agHelper.AssertElementExist(homePageLocators.appEditIcon);
          } else {
            throw new Error(
              "Invite developer app link not found in the email HTML",
            );
          }
        });
      cy.LogOut();
    });

    it("6. To verify application invite email with view right", () => {
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
      homePage.InviteUserToApplication(
        Cypress.env("TESTUSERNAME3"),
        "App Viewer",
      );
      cy.LogOut();
      agHelper
        .waitForEmail({
          pollInterval: POLL_INTERVAL,
          timeout: TIMEOUT,
          targetSubject: inviteEmailSubject,
          targetEmail: Cypress.env("TESTUSERNAME3"),
        })
        .then((email) => {
          console.log("Email:", email);
          expect(email).to.exist;
          expect(email.headers.subject).to.include(inviteEmailSubject);
          expect(email.headers.to).to.equal(Cypress.env("TESTUSERNAME3"));

          const emailHtml = email.html; // Store the email HTML content

          console.log("workspaceName", workspaceName);

          const inviteLinkMatch = emailHtml.match(
            /href="([^"]*applications[^"]*)"/,
          ); // Extract the link using regex

          if (inviteLinkMatch) {
            cy.LoginFromAPI(
              Cypress.env("TESTUSERNAME3"),
              Cypress.env("TESTPASSWORD3"),
            );
            const inviteLink = inviteLinkMatch[1].replace(/([^:]\/)\/+/g, "$1");
            console.log("Invite workspace Link:", inviteLink);
            cy.visit(inviteLink, { timeout: 60000 });

            homePage.SelectWorkspace(workspaceName);
            agHelper.AssertContains(applicationName);
            cy.get(homePageLocators.applicationCard)
              .first()
              .trigger("mouseover");
            agHelper.AssertElementAbsence(homePageLocators.appEditIcon);
          } else {
            throw new Error(
              "Invite viewr app link not found in the email HTML",
            );
          }
        });
      cy.LogOut();
    });
  },
);
