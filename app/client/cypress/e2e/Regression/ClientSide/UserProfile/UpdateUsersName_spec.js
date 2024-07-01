import homePage from "../../../../locators/HomePage";
import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Update a user's name", { tags: ["@tag.Settings"] }, function () {
  let username;

  it("1. Update a user's name", function () {
    _.homePage.NavigateToHome();
    cy.get(homePage.profileMenu).click();
    cy.get(".t--edit-profile").click({ force: true });

    cy.generateUUID().then((uid) => {
      username = uid;
      cy.get("[data-testid=t--display-name]").clear();
      cy.get("[data-testid=t--display-name]").click().type(username);
      // Waiting as the input onchange has a debounce
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(2000);
      cy.get(".t--admin-settings-back-button").click();
      cy.reload();
      cy.get(homePage.profileMenu).click();
      cy.get(".t--user-name").contains(username);
    });
  });

  it("2. Validate email address and Reset pwd", function () {
    cy.intercept("POST", "/api/v1/users/forgotPassword", {
      fixture: "resetPassword.json",
    }).as("resetPwd");
    _.agHelper.GetNClick(homePage.homeIcon, 0, true);
    _.agHelper.GetNClick(homePage.profileMenu, 0, true);
    cy.get(".t--edit-profile").click({ force: true });

    // Waiting as the input onchange has a debounce
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);
    cy.get(".ads-v2-input__input-section-input")
      .last()
      .invoke("val")
      .then((text) => {
        expect(text).to.equal(Cypress.env("USERNAME"));
      });

    cy.get(".ads-v2-button__content").last().contains("Reset password").click();
    cy.wait("@resetPwd").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });
});
