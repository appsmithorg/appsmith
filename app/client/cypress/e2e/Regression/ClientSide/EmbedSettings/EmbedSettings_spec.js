import * as _ from "../../../../support/Objects/ObjectsCore";
import adminSettings from "../../../../locators/AdminsSettings";
const appNavigationLocators = require("../../../../locators/AppNavigation.json");

describe("Embed settings options", function () {
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
    _.agHelper.GetNAssertElementText(
      _.embedSettings.locators._frameAncestorsSetting,
      setting,
    );
  }

  before(() => {
    _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.BUTTON);
    _.deployMode.DeployApp();
    cy.get(
      `${appNavigationLocators.header} ${appNavigationLocators.shareButton}`,
    ).click();
    cy.get("[data-testid='copy-application-url']").last().click();
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
    _.deployMode.DeployApp();
    cy.get(
      `${appNavigationLocators.header} ${appNavigationLocators.shareButton}`,
    ).click();
    cy.get("[data-testid='copy-application-url']").last().click();
    cy.window().its("navigator.clipboard").invoke("readText").as("deployUrl");
    cy.enablePublicAccess();
    cy.wait(6000);
    getIframeBody().contains("Submit").should("exist");
    _.deployMode.NavigateBacktoEditor();
  });

  it("1. Allow embedding everywhere", function () {
    cy.log(this.deployUrl);
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
    cy.get(adminSettings.restartNotice).should("not.exist");
    cy.visit(this.deployUrl);
    getIframeBody().contains("Submit").should("exist");
    ValidateEditModeSetting(_.embedSettings.locators._allowAllText);
  });

  it("2. Limit embedding", function () {
    cy.log(this.deployUrl);
    _.homePage.NavigateToHome();
    cy.get(".admin-settings-menu-option").click();
    cy.get(".t--admin-settings-APPSMITH_ALLOWED_FRAME_ANCESTORS").within(() => {
      cy.get("input").eq(1).click();
      cy.get(".bp3-input-ghost").type(window.location.origin).blur();
    });
    cy.get(adminSettings.saveButton).click();
    cy.waitForServerRestart();
    cy.get(adminSettings.restartNotice).should("not.exist");
    cy.visit(this.deployUrl);
    getIframeBody().contains("Submit").should("exist");

    ValidateEditModeSetting(_.embedSettings.locators._restrictedText);
  });
  it("3. Disable everywhere", function () {
    cy.log(this.deployUrl);
    _.homePage.NavigateToHome();
    cy.get(".admin-settings-menu-option").click();
    cy.get(".t--admin-settings-APPSMITH_ALLOWED_FRAME_ANCESTORS").within(() => {
      cy.get("input").last().click();
    });
    cy.get(adminSettings.saveButton).click();
    cy.waitForServerRestart();
    cy.get(adminSettings.restartNotice).should("not.exist");
    cy.visit(this.deployUrl);
    // TODO: Commented out as it is flaky
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
