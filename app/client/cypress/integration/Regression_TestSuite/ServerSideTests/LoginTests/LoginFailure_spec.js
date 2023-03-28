import * as _ from "../../../../support/Objects/ObjectsCore";
const loginPage = require("../../../../locators/LoginPage.json");

describe("Login failure", function () {
  it("preserves redirectUrl param on login failure", function () {
    let appUrl;
    _.deployMode.DeployApp();
    cy.location()
      .then((location) => {
        cy.LogOutUser();
        appUrl = location.href.split("?")[0];
        cy.visit(appUrl);
        cy.get(loginPage.username).should("be.visible");
      })
      .then(() => cy.GetUrlQueryParams())
      .then((queryParams) => {
        expect(decodeURIComponent(queryParams.redirectUrl)).to.eq(appUrl);
        cy.LoginUser("user@error.com", "pwd_error", false);
      })
      .then(() => cy.GetUrlQueryParams())
      .then((queryParams) => {
        expect(decodeURIComponent(queryParams.error)).to.eq("true");
        expect(decodeURIComponent(queryParams.redirectUrl)).to.eq(appUrl);
        cy.LoginUser(Cypress.env("USERNAME"), Cypress.env("PASSWORD"), false);
      })
      .then(() => cy.location())
      .then((location) => {
        expect(location.href.split("?")[0]).to.eq(appUrl);
      });
  });
});
