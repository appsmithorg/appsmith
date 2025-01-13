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

  let clipboardData;

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
    _.agHelper.GiveChromeCopyPermission();
    _.homePage.NavigateToHome();
    _.homePage.CreateNewApplication();
    _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.IFRAME);
    // cy.get("@embeddedAppUrl").then((url) => {
    cy.testJsontext(
      "url",
      "https://app.appsmith.com/applications/6752ba5904a5f464099437ec/pages/6752ba5904a5f464099437f3",
    );
    //});
    _.agHelper.Sleep(5000); //for Iframe to fully load with url data
    _.deployMode.DeployApp();
    cy.get(
      `${appNavigationLocators.header} ${appNavigationLocators.shareButton}`,
    )
      .click()
      .wait(1000);
    _.agHelper.ClickButton("Copy application url");

    cy.window().then((win) => {
      new Cypress.Promise((resolve, reject) => {
        win.navigator.clipboard.readText().then(resolve).catch(reject);
      }).then((text) => {
        clipboardData = text; // Store the clipboard content in a variable
        cy.log(`Clipboard Content: ${clipboardData}`); // Log clipboard content
        expect(clipboardData).to.equal("Expected clipboard text"); // Add assertions if needed
      });
    });

    // Log clipboard data after it's been set
    cy.then(() => {
      cy.log(`Stored Clipboard Data: ${clipboardData}`);
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

    cy.visit(clipboardData, { timeout: 60000 });
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
    cy.visit(clipboardData, { timeout: 60000 });
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
    cy.visit(clipboardData, { timeout: 60000 });
    getIframeBody().contains("Submit").should("not.exist");

    ValidateEditModeSetting(_.embedSettings.locators._disabledText);
  });
});
