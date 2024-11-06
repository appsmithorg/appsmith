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
    _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.BUTTON);
    _.deployMode.DeployApp();
    cy.get(
      `${appNavigationLocators.header} ${appNavigationLocators.shareButton}`,
    )
      .click()
      .wait(1000);
    _.agHelper.GetNClick("[data-testid='copy-application-url']");
    _.agHelper.GiveChromeCopyPermission();

    cy.window()
      .its("navigator.clipboard")
      .invoke("readText")
      .then((text) => {
        cy.wrap(text).as("embeddedAppUrl");
      });

    cy.enablePublicAccess();
    cy.get(
      `${appNavigationLocators.header} ${appNavigationLocators.backToAppsButton}`,
    ).click();
    _.homePage.CreateNewApplication();
    _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.IFRAME);
    cy.get("@embeddedAppUrl").then((url) => {
      cy.testJsontext("url", url);
    });
    _.agHelper.Sleep(5000); //for Iframe to fully load with url data
    _.deployMode.DeployApp();
    cy.get(
      `${appNavigationLocators.header} ${appNavigationLocators.shareButton}`,
    )
      .click()
      .wait(1000);
    _.agHelper.GetNClick("[data-testid='copy-application-url']");
    cy.window()
      .its("navigator.clipboard")
      .invoke("readText")
      .then((text) => {
        cy.wrap(text).as("deployUrl");
      });
    cy.enablePublicAccess();
    cy.wait(8000); //adding wait time for iframe to load fully!
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
    // TODO: Commented out as it is flaky
    // cy.wait(["@getEnvVariables", "@getEnvVariables"]).then((interception) => {
    //   const {
    //     APPSMITH_ALLOWED_FRAME_ANCESTORS,
    //   } = interception[1].response.body.data;
    //   expect(APPSMITH_ALLOWED_FRAME_ANCESTORS).to.equal("*");
    // });
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
    }); // TODO: Commented out as it is flaky
    // cy.wait(["@getEnvVariables", "@getEnvVariables"]).then((interception) => {
    //   const {
    //     APPSMITH_ALLOWED_FRAME_ANCESTORS,
    //   } = interception[1].response.body.data;
    //   expect(APPSMITH_ALLOWED_FRAME_ANCESTORS).to.equal("'none'");
    // });
    getIframeBody().contains("Submit").should("not.exist");

    ValidateEditModeSetting(_.embedSettings.locators._disabledText);
  });
});
