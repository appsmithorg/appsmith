import { agHelper } from "../../../../../support/Objects/ObjectsCore";

describe("SSO test", { tags: ["@tag.Widget", "@tag.JSONForm"] }, () => {
  // it("1. hello sso", () => {
  //     homePage.LogOutviaAPI()
  // });

  it("2. hello sso", () => {
    cy.clearCookies();
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.pause();
    logUsingAuth0("sharanya+auth0@appsmith.com", "Appsmith1@");
  });
});

function logUsingAuth0(username: string, password: string) {
  Cypress.on("uncaught:exception", (err) => {
    return false;
  });

  agHelper.GetNClick('[data-testid="login-with-OIDC"]');
  //cy.get('[data-testid="login-with-OIDC"]').click()

  cy.origin(
    "https://dev-ni5otnk66uj647ck.us.auth0.com/",
    {
      args: {
        username,
        password,
      },
    },
    ({ username, password }) => {
      cy.get('[id="username"]').type(username);
      cy.get('[id="password"]').type(password, {
        log: false,
      });
      cy.contains("Continue").click({ force: true }).wait(4000);
    },
  );

  agHelper.GetNClick('[data-testid="login-with-OIDC"]');
  //cy.get('[data-testid="login-with-OIDC"]').click()
  cy.pause();
}
