import {
  agHelper,
  deployMode,
  homePage,
  locators,
  assertHelper,
} from "../../../../support/Objects/ObjectsCore";

describe.skip("Login failure", function () {
  it("1. Preserves redirectUrl param on login failure", function () {
    let appUrl;
    deployMode.DeployApp(locators._emptyPageTxt);
    cy.location()
      .then((location) => {
        appUrl = location.href.split("?")[0];
        cy.LogOutUser();
        agHelper.Sleep(2000);
        agHelper.AssertElementVisible(homePage._username); //check if user is logged out & then try to visit app url
        cy.window({ timeout: 60000 }).then((win) => {
          win.location.href = appUrl;
        });
        agHelper.Sleep(3000); //for page redirect to complete
        assertHelper.AssertNetworkStatus("signUpLogin");
        agHelper.AssertElementVisible(homePage._username);
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
