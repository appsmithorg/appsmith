describe("Login", () => {
  it("Login through Google", () => {
    cy.LogOut();
    cy.xpath("//a/div[contains(text(),'continue with Google')]").click();
    const username = Cypress.env("googleSocialLoginUsername");
    const password = Cypress.env("googleSocialLoginPassword");
    const loginUrl = "https://release.app.appsmith.com//user/login";
    const cookieName = Cypress.env("cookieName");
    const socialLoginOptions = {
      username,
      password,
      loginUrl,
      headless: true,
      logs: false,
      loginSelector: 'a[href="https://github.com/auth/auth0/google-oauth2"]',
      postLoginSelector: ".account-panel",
    };

    cy.task("GoogleSocialLogin", socialLoginOptions).then(({ cookies }) => {
      cy.clearCookies();

      const cookie = cookies
        .filter((cookie) => cookie.name === cookieName)
        .pop();
      if (cookie) {
        cy.setCookie(cookie.name, cookie.value, {
          domain: cookie.domain,
          expiry: cookie.expires,
          httpOnly: cookie.httpOnly,
          path: cookie.path,
          secure: cookie.secure,
        });

        Cypress.Cookies.defaults({
          whitelist: cookieName,
        });
      }
    });
  });

  it("Navigate to Applications", () => {
    cy.visit("/applications");
    cy.wait("@applications").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });
});
