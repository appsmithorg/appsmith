const commonlocators = require("../../../../../locators/commonlocators.json");
import {
  agHelper,
  entityExplorer,
  deployMode,
  propPane,
  homePage,
} from "../../../../../support/Objects/ObjectsCore";

describe("SSO test", { tags: ["@tag.Widget", "@tag.JSONForm"] }, () => {
  it("2. hello sso", () => {
    cy.pause();
    logIntoGoogle("sharanya-appsmith", "Drel#mha11");
  });
});

function logIntoGoogle(username: string, password: string) {
  Cypress.on("uncaught:exception", (err) => {
    return false;
  });

  cy.get('[data-testid="login-with-Github"]').click();

  cy.origin(
    "https://github.com/",
    {
      args: {
        username,
        password,
      },
    },
    ({ username, password }) => {
      cy.wait(6000);
      cy.get('[name="login"]').type(username);
      cy.wait(6000);
      cy.get('[name="password"]').type(password, {
        log: false,
      });
      cy.get('[name="commit"]').click();

      cy.pause();
    },
  );
}
