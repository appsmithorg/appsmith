import User from "../../../../fixtures/user.json";

function mockSegmentKey() {
  cy.window().then((window) => {
    if (!window.APPSMITH_FEATURE_CONFIGS.segment) {
      window.APPSMITH_FEATURE_CONFIGS.segment = {
        apiKey: "test",
        ceKey: "test",
      };
    }
  });
}

let appId;

describe("Checks for analytics initialization", function() {
  it("Should check analytics is not initialised when enableTelemtry is false", function() {
    cy.intercept("GET", "/api/v1/users/me", {
      body: { responseMeta: { status: 200, success: true }, data: User },
    }).as("getUsersWithoutTelemetry");
    cy.visit("/applications");
    cy.reload();
    mockSegmentKey();
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
    }).as("getUsersWithoutTelemetry");
    cy.visit("/applications");
    cy.reload();
    mockSegmentKey();
    cy.wait("@getUsersWithoutTelemetry");
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
});
