import {
  agHelper,
  deployMode,
  homePage,
  locators,
  assertHelper,
} from "../../../../support/Objects/ObjectsCore";

describe("Login failure", function () {
  it("1. Preserves redirectUrl param on login failure", function () {
    let urlWithoutQueryParams;
    deployMode.DeployApp(locators._emptyPageTxt);

    cy.url()
      .then((url) => {
        urlWithoutQueryParams = url.split("?")[0];
        homePage.LogOutviaAPI();
        agHelper.VisitNAssert(urlWithoutQueryParams, "signUpLogin");
        // agHelper.Sleep(3000); //for page redirect to complete
        // assertHelper.AssertNetworkStatus("signUpLogin");
      })
      .then(() => cy.GetUrlQueryParams())
      .then((queryParams) => {
        expect(decodeURIComponent(queryParams.redirectUrl)).to.eq(
          urlWithoutQueryParams,
        );
        cy.LoginUser("user@error.com", "pwd_error", false);
      })
      .then(() => cy.GetUrlQueryParams())
      .then((queryParams) => {
        expect(decodeURIComponent(queryParams.error)).to.eq("true");
        expect(decodeURIComponent(queryParams.redirectUrl)).to.eq(
          urlWithoutQueryParams,
        );
        cy.LoginUser(Cypress.env("USERNAME"), Cypress.env("PASSWORD"), false);
      })
      .then(() => cy.url())
      .then((url) => {
        expect(url.split("?")[0]).to.eq(urlWithoutQueryParams);
      });
  });
});
