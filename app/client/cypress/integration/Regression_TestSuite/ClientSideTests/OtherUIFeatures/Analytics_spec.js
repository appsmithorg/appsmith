import User from "../../../../fixtures/user.json";
import * as _ from "../../../../support/Objects/ObjectsCore";
import adminLocators from "../../../../locators/AdminsSettings";

let appId;

describe("Checks for analytics initialization", function () {
  it("1. Bug: 21191: Even if usage data preference is on, share anonymous usage is unchecked", function () {
    _.homePage.NavigateToHome();
    _.adminSettings.NavigateToAdminSettings();
    _.agHelper.GetElement(adminLocators.usageDataCheckbox).should("be.checked");
    _.agHelper.GetNClick(adminLocators.usageDataCheckbox, 0, true);
    _.agHelper
      .GetElement(adminLocators.usageDataCheckbox)
      .should("not.be.checked");
    _.agHelper.GetNClick(adminLocators.saveButton);
    _.agHelper
      .GetElement(adminLocators.restartNotice, 90000)
      .should("have.length", 0);
  });
  it("2. Should check analytics is not initialised when enableTelemtry is false", function () {
    cy.visit("/applications");
    cy.reload();
    cy.wait(3000);
    cy.wait("@getMe")
      .wait("@getMe")
      .should(
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
      cy.CreateAppInFirstListedWorkspace(id);
      localStorage.setItem("AppName", appId);
    });
    cy.wait(3000);
    cy.window().then(() => {
      cy.wrap(interceptFlag).should("eq", false);
    });
  });

  it("3. Should check smartlook is not initialised when enableTelemtry is false", function () {
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

  it("4. Should check Sentry is not initialised when enableTelemtry is false", function () {
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
