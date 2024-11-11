import {
  agHelper,
  deployMode,
  homePage,
  locators,
} from "../../../../support/Objects/ObjectsCore";

describe("Login failure", { tags: ["@tag.Authentication"] }, function () {
  it("1. Preserves redirectUrl param on login failure", function () {
    let urlWithoutQueryParams;
    deployMode.DeployApp(locators._emptyPageTxt, true, false);

    cy.url()
      .then((url) => {
        urlWithoutQueryParams = url.split("?")[0];
        homePage.Signout(false);
        agHelper.VisitNAssert(urlWithoutQueryParams, "getConsolidatedData");
        agHelper.AssertElementVisibility(locators._buttonByText("Sign in"));
      })
      .then(() =>
        cy.GetUrlQueryParams().then((queryParams) => {
          expect(decodeURIComponent(queryParams.redirectUrl)).to.eq(
            urlWithoutQueryParams,
          );
        }),
      );
    cy.LoginUser("user@error.com", "pwd_error", false);
    cy.GetUrlQueryParams().then((queryParams) => {
      expect(decodeURIComponent(queryParams.error)).to.eq("true");
      expect(decodeURIComponent(queryParams.redirectUrl)).to.eq(
        urlWithoutQueryParams,
      );
      agHelper.AssertElementVisibility(
        locators._visibleTextSpan(
          "It looks like you may have entered incorrect/invalid credentials",
          true,
        ),
      );
      cy.LoginUser(Cypress.env("USERNAME"), Cypress.env("PASSWORD"), false);
    }),
      cy.url().then((url) => {
        agHelper.AssertElementVisibility(locators._emptyPageTxt);
        expect(url.split("?")[0]).to.eq(urlWithoutQueryParams);
      });
  });
});
