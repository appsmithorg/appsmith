import * as _ from "../../../../support/Objects/ObjectsCore";
import adminSettings from "../../../../locators/AdminsSettings";
const appNavigationLocators = require("../../../../locators/AppNavigation.json");

describe("Embed settings options", { tags: ["@tag.Settings"] }, function () {
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

  function ValidateEditModeSetting(setting) {
    _.deployMode.NavigateBacktoEditor();
    _.embedSettings.OpenEmbedSettings();

    _.agHelper.WaitForCondition(() => {
      _.agHelper.GetNAssertElementText(
        _.embedSettings.locators._frameAncestorsSetting,
        setting,
      );
    });
  }

  before(() => {
    _.homePage.NavigateToHome();
    _.homePage.CreateNewApplication();
    _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.IFRAME);
    // cy.get("@embeddedAppUrl").then((url) => {
    cy.testJsontext(
      "url",
      "https://app.appsmith.com/applications/6752ba5904a5f464099437ec/pages/6752ba5904a5f464099437f3",
    );
    //});
    cy.get(".t--widget-iframewidget iframe").should("be.visible").and("have.attr", "src");
    _.deployMode.DeployApp();
    cy.get(
      `${appNavigationLocators.header} ${appNavigationLocators.shareButton}`,
    )
      .click();
    cy.get(".bp3-popover-content").should("be.visible");
    _.agHelper.ClickButton("Copy application url");
    cy.window().then((win) => {
      cy.stub(win.navigator.clipboard, "writeText").as("deployUrl").resolves();
    });
    cy.enablePublicAccess();
    cy.wait(8000); //adding wait time for iframe to load fully!
    _.agHelper.RefreshPage();
    getIframeBody().contains("Submit").should("exist");
    _.deployMode.NavigateToHomeDirectly();
  });

  it("1. Limit embedding then Allow embedding everywhere then Disable everywhere", function () {
    cy.get(".admin-settings-menu-option").click();
    cy.get(".t--admin-settings-APPSMITH_ALLOWED_FRAME_ANCESTORS").within(() => {
      cy.get("input").eq(1).click();
      cy.get(".bp3-input-ghost").type(window.location.origin).blur();
    });
    cy.get(adminSettings.saveButton).click();
    cy.waitForServerRestart();
    _.agHelper.Sleep(2000);
    cy.get("@deployUrl").then((depUrl) => {
      cy.log("deployUrl is " + depUrl);
      cy.visit(depUrl, { timeout: 60000 });
    });
    getIframeBody().contains("Submit").should("exist");
    ValidateEditModeSetting(_.embedSettings.locators._restrictedText);
    // });

    // it("2. Allow embedding everywhere", function () {
    _.homePage.NavigateToHome();
    cy.get(".admin-settings-menu-option").click();
    cy.get(".t--admin-settings-APPSMITH_ALLOWED_FRAME_ANCESTORS").within(() => {
      cy.get("input").eq(0).click();
    });
    cy.get(adminSettings.saveButton).click();
    cy.waitForServerRestart();
    _.agHelper.Sleep(2000);
    cy.get("@deployUrl").then((depUrl) => {
      cy.log("deployUrl is " + depUrl);
      cy.visit(depUrl, { timeout: 60000 });
    });
    getIframeBody().contains("Submit").should("exist");
    ValidateEditModeSetting(_.embedSettings.locators._allowAllText);
    // });

    // it("3. Disable everywhere", function () {
    _.homePage.NavigateToHome();
    cy.get(".admin-settings-menu-option").click();
    cy.get(".t--admin-settings-APPSMITH_ALLOWED_FRAME_ANCESTORS").within(() => {
      cy.get("input").last().click();
    });
    cy.get(adminSettings.saveButton).click();
    cy.waitForServerRestart();
    _.agHelper.Sleep(2000);
    cy.get("@deployUrl").then((depUrl) => {
      cy.log("deployUrl is " + depUrl);
      cy.visit(depUrl, { timeout: 60000 });
    });
    getIframeBody().contains("Submit").should("not.exist");

    ValidateEditModeSetting(_.embedSettings.locators._disabledText);
  });
});
