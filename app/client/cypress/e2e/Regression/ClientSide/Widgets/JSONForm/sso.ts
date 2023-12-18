const commonlocators = require("../../../../../locators/commonlocators.json");
import {
  agHelper,
  entityExplorer,
  deployMode,
  propPane,
  homePage,
} from "../../../../../support/Objects/ObjectsCore";

describe("SSO test", { tags: ["@tag.Widget", "@tag.JSONForm"] }, () => {
  // it("1. hello sso", () => {
  //     homePage.LogOutviaAPI()
  // });

  it("2. hello sso", () => {
    cy.pause();
    logIntoGoogle("sharanya@appsmith.com", "Drel#mha11");
  });
});

function logIntoGoogle(username: string, password: string) {
  Cypress.on("uncaught:exception", (err) => {
    return false;
  });

  cy.get('[data-testid="login-with-Google"]').click();

  cy.origin(
    "https://accounts.google.com/",
    {
      args: {
        username,
        password,
      },
    },
    ({ username, password }) => {
      cy.wait(6000);
      cy.get('[name="identifier"]').type(username);
      cy.wait(6000);
      cy.pause();
      //cy.contains('Next').click().wait(4000)
      cy.get('[name="password"]').type(password, {
        log: false,
      });
      cy.contains("Next").click().wait(4000);
      // cy.get('[name="commit"]').click().wait(4000)

      cy.pause();
    },
  );
}
