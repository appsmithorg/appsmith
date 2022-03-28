import User from "../../../../fixtures/user.json";

let appId;

describe("Checks for analytics initialization", function() {
  it("Should check analytics is not initialised when enableTelemtry is false", function() {
    cy.visit("/applications");
    cy.reload();
    cy.wait(3000);
    cy.wait("@getUser").should(
      "have.nested.property",
      "response.body.data.enableTelemetry",
      false,
    );
    cy.window().then((window) => {
      expect(window.analytics).to.be.equal(undefined);
    });
    let interceptFlag = false;
    cy.intercept("POST", "https://api.segment.io/**", (req) => {
      interceptFlag = true;
      req.continue();
    });
    cy.generateUUID().then((id) => {
      appId = id;
      cy.CreateAppInFirstListedOrg(id);
      localStorage.setItem("AppName", appId);
    });
    cy.wait(3000);
    cy.window().then(() => {
      cy.wrap(interceptFlag).should("eq", false);
    });
  });

  it("Should check smartlook is not initialised when enableTelemtry is false", function() {
    cy.visit("/applications");
    cy.reload();
    cy.wait(3000);
    cy.wait("@getUser");
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
      cy.CreateAppInFirstListedOrg(id);
      localStorage.setItem("AppName", appId);
    });
    cy.wait(3000);
    cy.window().then(() => {
      cy.wrap(interceptFlag).should("eq", false);
    });
  });

  it("Should check Sentry is not initialised when enableTelemtry is false", function() {
    cy.visit("/applications");
    cy.reload();
    cy.wait(3000);
    cy.wait("@getUser");
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
      cy.CreateAppInFirstListedOrg(id);
      localStorage.setItem("AppName", appId);
    });
    cy.wait(3000);
    cy.window().then(() => {
      cy.wrap(interceptFlag).should("eq", false);
    });
  });
});
