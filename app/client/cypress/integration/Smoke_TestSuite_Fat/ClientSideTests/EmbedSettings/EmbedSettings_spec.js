import { ObjectsRegistry } from "../../../../support/Objects/Registry";
const adminSettings = require("../../../../locators/AdminsSettings");
import homePageLocators from "../../../../locators/HomePage";

describe("Embed settings options", function() {
  const {
    AggregateHelper: agHelper,
    DeployMode: deployMode,
    EntityExplorer: ee,
    HomePage: homePage,
  } = ObjectsRegistry;

  const getIframeBody = () => {
    // get the iframe > document > body
    // and retry until the body element is not empty
    return (
      cy
        .get(".t--widget-iframewidget iframe")
        .its("0.contentDocument.body")
        .should("not.be.empty")
        // wraps "body" DOM element to allow
        // chaining more Cypress commands, like ".find(...)"
        // https://on.cypress.io/wrap
        .then(cy.wrap)
    );
  };

  before(() => {
    ee.DragDropWidgetNVerify("buttonwidget", 100, 100);
    deployMode.DeployApp();
    cy.get("[data-cy='viewmode-share']").click();
    cy.get(".t--deployed-url input")
      .invoke("attr", "value")
      .as("embeddedAppUrl");
    cy.enablePublicAccess();
    cy.get(".t--back-to-home").click();
    homePage.CreateNewApplication();
    ee.DragDropWidgetNVerify("iframewidget", 100, 100);
    cy.get("@embeddedAppUrl").then((url) => {
      cy.testJsontext("url", url);
    });
    // cy.testJsontext("url", this.embeddedAppUrl);
    deployMode.DeployApp();
    cy.get("[data-cy='viewmode-share']").click();
    cy.get(".t--deployed-url input")
      .invoke("attr", "value")
      .as("deployUrl");
    cy.enablePublicAccess();
    cy.wait(6000);
    getIframeBody()
      .contains("Submit")
      .should("exist");
  });

  beforeEach(() => {
    agHelper.RestoreLocalStorageCache();
  });

  afterEach(() => {
    agHelper.SaveLocalStorageCache();
  });

  describe("Wrapper to get access to the alias in all tests", () => {
    it("1. Allow embedding everywhere", function() {
      cy.log(this.deployUrl);
      cy.get(".t--back-to-home").click();
      cy.get(".admin-settings-menu-option").click();
      cy.get(".t--admin-settings-APPSMITH_ALLOWED_FRAME_ANCESTORS").within(
        () => {
          cy.get("input")
            .eq(0)
            .click();
        },
      );
      cy.get(adminSettings.saveButton).click();
      cy.wait(50000);
      cy.get(adminSettings.restartNotice).should("not.exist");
      cy.visit(this.deployUrl);
      getIframeBody()
        .contains("Submit")
        .should("exist");
    });

    it("2. Limit embedding", function() {
      cy.log(this.deployUrl);
      cy.get(".t--back-to-home").click();
      cy.get(".admin-settings-menu-option").click();
      cy.get(".t--admin-settings-APPSMITH_ALLOWED_FRAME_ANCESTORS").within(
        () => {
          cy.get("input")
            .eq(1)
            .click();
          cy.get(".bp3-tag-remove")
            .eq(1)
            .click();
          cy.get(".bp3-tag-remove")
            .eq(0)
            .click();
          cy.get(".bp3-input-ghost").type(window.location.origin);
        },
      );
      cy.get(adminSettings.saveButton).click();
      cy.wait(50000);
      cy.get(adminSettings.restartNotice).should("not.exist");
      cy.visit(this.deployUrl);
      getIframeBody()
        .contains("Submit")
        .should("exist");
    });
    it("3. Disable everywhere", function() {
      cy.log(this.deployUrl);
      cy.get(".t--back-to-home").click();
      cy.get(".admin-settings-menu-option").click();
      cy.get(".t--admin-settings-APPSMITH_ALLOWED_FRAME_ANCESTORS").within(
        () => {
          cy.get("input")
            .last()
            .click();
        },
      );
      cy.get(adminSettings.saveButton).click();
      cy.wait(60000);
      cy.get(adminSettings.restartNotice).should("not.exist");
      cy.visit(this.deployUrl);
      cy.wait("@getMe").then((interception) => {
        cy.log(interception.response.headers);
        expect(
          interception.response.headers["content-security-policy"],
        ).include("'none'");
      });
      getIframeBody()
        .contains("Submit")
        .should("not.exist");
    });
  });
});
