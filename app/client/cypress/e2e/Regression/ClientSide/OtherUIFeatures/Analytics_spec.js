import { agHelper, homePage } from "../../../../support/Objects/ObjectsCore";

describe(
  "excludeForAirgap",
  "Checks for analytics for enableTelemtry",
  function () {
    before(() => {
      homePage.NavigateToHome();
      cy.get(".admin-settings-menu-option").click();
      cy.get("[data-testid='APPSMITH_DISABLE_TELEMETRY']").should("be.checked"); //Bug 21191
      cy.get("[data-testid='APPSMITH_DISABLE_TELEMETRY']").uncheck({
        force: true,
      }); //disabling sharing of anonymous data
      cy.get(".t--admin-settings-save-button").click();
      cy.wait(2000);
      cy.get(".t--admin-settings-restart-notice", { timeout: 180000 }).should(
        "not.exist",
      );
      cy.wait("@getGeneral").its("response.statusCode").should("eq", 200);
    });

    it("1. Should check analytics is not initialised when enableTelemtry is false", function () {
      agHelper.VisitNAssert("/applications", "getReleaseItems");
      // agHelper.RefreshPage();
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
      homePage.CreateNewApplication();
      cy.wait(3000);
      cy.window().then(() => {
        cy.wrap(interceptFlag).should("eq", false);
      });
    });

    it("2. Should check smartlook is not initialised when enableTelemtry is false", function () {
      agHelper.VisitNAssert("/applications", "getReleaseItems");
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

      homePage.CreateNewApplication();
      cy.wait(3000);
      cy.window().then(() => {
        cy.wrap(interceptFlag).should("eq", false);
      });
    });

    it("3. Should check Sentry is not initialised when enableTelemtry is false", function () {
      agHelper.VisitNAssert("/applications", "getReleaseItems");
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
      homePage.CreateNewApplication();
      cy.wait(3000);
      cy.window().then(() => {
        cy.wrap(interceptFlag).should("eq", false);
      });
    });
  },
);
