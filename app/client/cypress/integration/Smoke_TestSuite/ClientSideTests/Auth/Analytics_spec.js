import User from "../../../../fixtures/user.json";

let appId;

describe("Checks for analytics initialization", function() {
  it("Should check analytics is not initialised when enableTelemtry is false", function() {
    cy.intercept("GET", "/api/v1/users/me", {
      body: { responseMeta: { status: 200, success: true }, data: User },
    }).as("getUsersWithoutTelemetry");
    cy.visit("/applications");
    cy.reload();
    cy.wait("@getUsersWithoutTelemetry");
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
  it("Should check analytics is initialised when enableTelemtry is true", function() {
    cy.intercept("GET", "/api/v1/users/me", {
      body: {
        responseMeta: { status: 200, success: true },
        data: {
          ...User,
          enableTelemetry: true,
        },
      },
    }).as("getUsersWithTelemetry");
    cy.visit("/applications");
    cy.reload();
    cy.wait("@getUsersWithTelemetry");
    cy.wait(5000);
    cy.window().then((window) => {
      expect(window.analytics).not.to.be.undefined;
    });
    cy.wait(3000);
    let interceptFlag = false;
    cy.intercept("POST", "https://api.segment.io/**", (req) => {
      interceptFlag = true;
      req.continue();
    }).as("segment");
    cy.generateUUID().then((id) => {
      appId = id;
      cy.CreateAppInFirstListedOrg(id);
      localStorage.setItem("AppName", appId);
    });
    cy.wait("@segment");
    cy.window().then(() => {
      cy.wrap(interceptFlag).should("eq", true);
    });
  });

  it("Should check smartlook is not initialised when enableTelemtry is false", function() {
    cy.intercept("GET", "/api/v1/users/me", {
      body: { responseMeta: { status: 200, success: true }, data: User },
    }).as("getUsersWithoutTelemetry");
    cy.visit("/applications");
    cy.reload();
    cy.wait("@getUsersWithoutTelemetry");
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
    cy.intercept("GET", "/api/v1/users/me", {
      body: { responseMeta: { status: 200, success: true }, data: User },
    }).as("getUsersWithoutTelemetry");
    cy.visit("/applications");
    cy.reload();
    cy.wait("@getUsersWithoutTelemetry");
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
