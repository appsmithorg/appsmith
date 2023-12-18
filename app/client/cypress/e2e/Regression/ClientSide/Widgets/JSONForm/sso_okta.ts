import {
  adminSettings,
  agHelper,
  homePage,
} from "../../../../../support/Objects/ObjectsCore";

describe("SSO test", { tags: ["@tag.Widget", "@tag.JSONForm"] }, () => {
  // it("1. hello sso", () => {
  //     homePage.LogOutviaAPI()
  // });

  it("2. hello sso", () => {
    homePage.NavigateToHome();
    adminSettings.NavigateToAdminSettings();
    agHelper.GetNClick(".t--settings-category-authentication");
    agHelper.GetNClick(".t--settings-sub-category-oidc-auth");
    agHelper.TypeText(
      '[name="APPSMITH_OAUTH2_OIDC_CLIENT_ID"]',
      "0oa8q4ni6xgvMM8bH697",
    );
    agHelper.TypeText(
      '[name="APPSMITH_OAUTH2_OIDC_CLIENT_SECRET"]',
      "BjJ7mEcigr8qVs8cNWrBEjb-ENDFbsJXu7LGQ_vRcaVCo_3J8ehTWnl88FtGrkAQ",
    );
    agHelper.TypeText(
      '[name="APPSMITH_OAUTH2_OIDC_AUTHORIZATION_URI"]',
      "https://trial-9941756.okta.com/oauth2/v1/authorize",
    );
    agHelper.TypeText(
      '[name="APPSMITH_OAUTH2_OIDC_TOKEN_URI"]',
      "https://trial-9941756.okta.com/oauth2/v1/token",
    );
    agHelper.TypeText(
      '[name="APPSMITH_OAUTH2_OIDC_USER_INFO"]',
      "https://trial-9941756.okta.com/oauth2/v1/userinfo",
    );
    agHelper.TypeText(
      '[name="APPSMITH_OAUTH2_OIDC_JWK_SET_URI"]',
      "https://trial-9941756.okta.com/oauth2/v1/keys",
    );
    agHelper.ClickButton("Save & Restart");
    logUsingAuth0("sharanya@appsmith.com", "Drel#mha11@");
  });
});

function logUsingAuth0(username: string, password: string) {
  Cypress.on("uncaught:exception", (err) => {
    return false;
  });
  cy.log(Cypress.currentTest.title);
  cy.log(Cypress.currentTest.titlePath[0]);

  cy.session("my-session", () => {
    cy.visit("http://localhost/");
    cy.get('[data-testid="login-with-OIDC"]').click();
    cy.origin(
      "https://trial-9941756.okta.com/",
      {
        args: {
          username,
          password,
        },
      },
      ({ username, password }) => {
        cy.get('[name="identifier"]').type(username);
        cy.get('[name="credentials.passcode"]').type(password, {
          log: false,
        });
        cy.get('[value="Sign in"]').click({ force: true }).wait(4000);
      },
    );
    cy.get('[data-testid="login-with-OIDC"]').click();
    cy.get(".t--applications-container .createnew")
      .should("be.visible")
      .should("be.enabled");
    cy.generateUUID().then((id) => {
      cy.CreateAppInFirstListedWorkspace(id);
      // localStorage.setItem("AppName", id);
    });
  });
  cy.pause();
}
