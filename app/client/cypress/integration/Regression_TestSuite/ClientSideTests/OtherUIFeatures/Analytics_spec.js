let appId;

describe("Checks for analytics for enableTelemtry", function () {
  before(() => {
    cy.visit("/applications");
    cy.get(".admin-settings-menu-option").click();
    cy.get("[data-cy='APPSMITH_DISABLE_TELEMETRY'] > input").should(
      "be.checked",
    ); //Bug 21191
    cy.get("[data-cy='APPSMITH_DISABLE_TELEMETRY']")
      .find("span")
      .last()
      .click(); //disabling sharing of anonymous data
    cy.get(".t--admin-settings-save-button").click();
    cy.wait(2000);
    cy.get(".t--admin-settings-restart-notice", { timeout: 120000 }).should(
      "not.exist",
    );
    cy.wait("@getGeneral").its("response.statusCode").should("eq", 200);
  });

  it("1. Should check analytics is not initialised when enableTelemtry is false", function () {
    cy.visit("/applications");
    // cy.reload();
    // cy.wait(3000);
    // cy.wait("@getMe")
    //   //.wait("@getMe")
    //   .should(
    //     "have.nested.property",
    //     "response.body.data.enableTelemetry",
    //     false,
    //   );
    cy.window().then((window) => {
      expect(window.analytics).to.equal(undefined);
    });
    let interceptFlag = false;
    cy.intercept("POST", "https://api.segment.io/**", (req) => {
      interceptFlag = true;
      req.continue();
    });
    cy.get(".t--new-button").should("be.visible");
    cy.generateUUID().then((id) => {
      appId = id;
      cy.CreateAppInFirstListedWorkspace(id);
      localStorage.setItem("AppName", appId);
    });
    cy.wait(3000);
    cy.window().then(() => {
      cy.wrap(interceptFlag).should("eq", false);
    });
  });

  it("2. Should check smartlook is not initialised when enableTelemtry is false", function () {
    cy.visit("/applications");
    cy.reload();
    cy.wait(3000);
    cy.wait("@getMe");
    cy.window().then((window) => {
      expect(window.smartlook).to.be.equal(undefined);
    });
    let interceptFlag = false;
    cy.intercept("POST", "https://**.smartlook.**", (req) => {
      interceptFlag = true;
      req.continue();
    });
    cy.generateUUID().then((id) => {
      appId = id;
      cy.CreateAppInFirstListedWorkspace(id);
      localStorage.setItem("AppName", appId);
    });
    cy.wait(3000);
    cy.window().then(() => {
      cy.wrap(interceptFlag).should("eq", false);
    });
  });

  it("3. Should check Sentry is not initialised when enableTelemtry is false", function () {
    cy.visit("/applications");
    cy.reload();
    cy.wait(3000);
    cy.wait("@getMe");
    cy.window().then((window) => {
      expect(window.Sentry).to.be.equal(undefined);
    });
    let interceptFlag = false;
    cy.intercept("POST", "https://**.sentry.io/**", (req) => {
      interceptFlag = true;
      req.continue();
    });
    cy.generateUUID().then((id) => {
      appId = id;
      cy.CreateAppInFirstListedWorkspace(id);
      localStorage.setItem("AppName", appId);
    });
    cy.wait(3000);
    cy.window().then(() => {
      cy.wrap(interceptFlag).should("eq", false);
    });
  });
});
