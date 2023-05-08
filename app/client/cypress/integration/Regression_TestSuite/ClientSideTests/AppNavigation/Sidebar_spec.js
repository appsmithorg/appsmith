const appNavigationLocators = require("../../../../locators/AppNavigation.json");
const commonLocators = require("../../../../locators/commonlocators.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const deployMode = ObjectsRegistry.DeployMode;
const agHelper = ObjectsRegistry.AggregateHelper;
const homePage = ObjectsRegistry.HomePage;

describe("Test Sidebar navigation style", function () {
  before(() => {
    // Import an application
    homePage.NavigateToHome();
    homePage.ImportApp("appNavigationTestingAppWithLongPageNamesAndTitle.json");

    cy.wait("@importNewApplication").then((interception) => {
      agHelper.Sleep();

      const { isPartialImport } = interception.response.body.data;

      if (isPartialImport) {
        homePage.AssertNCloseImport();
      } else {
        homePage.AssertImportToast();
      }
    });
  });

  it("1. Change 'Orientation' to 'Side', sidebar should appear", () => {
    cy.get(appNavigationLocators.appSettingsButton).click();
    cy.get(appNavigationLocators.navigationSettingsTab).click();
    cy.get(
      appNavigationLocators.navigationSettings.orientationOptions.side,
    ).click({
      force: true,
    });
    deployMode.DeployApp();
    cy.get(appNavigationLocators.sidebar).should("exist");
    cy.get(appNavigationLocators.topStacked).should("not.exist");
    cy.get(appNavigationLocators.topInline).should("not.exist");
  });

  it("2. Page change should work", () => {
    const pageName = "Page5 - with long long name";

    cy.get(appNavigationLocators.navigationMenuItem)
      .contains(pageName)
      .click({ force: true });
    cy.get(appNavigationLocators.navigationMenuItem)
      .contains(pageName)
      .parent()
      .parent()
      .parent()
      .parent()
      .parent()
      .should("have.class", "is-active");
  });

  it("3. Sidebar background should be default to white, and should change when background color is set to theme", () => {
    // The background of sidebar should be white since light color style is default
    cy.get(appNavigationLocators.sidebar).should(
      "have.css",
      "background-color",
      "rgb(255, 255, 255)",
    );

    // Changing color style to theme should change navigation's background color
    deployMode.NavigateBacktoEditor();
    cy.get(appNavigationLocators.appSettingsButton).click();
    cy.get(appNavigationLocators.navigationSettingsTab).click();
    cy.get(
      appNavigationLocators.navigationSettings.colorStyleOptions.theme,
    ).click({
      force: true,
    });
    deployMode.DeployApp();
    cy.get(appNavigationLocators.sidebar).should(
      "have.css",
      "background-color",
      "rgb(85, 61, 233)",
    );
  });

  it("4. Application name, share button, edit button, and user dropdown should be available in the app sidebar", () => {
    cy.get(appNavigationLocators.applicationName).should("exist");
    cy.get(appNavigationLocators.shareButton).should("exist");
    cy.get(appNavigationLocators.editButton).should("exist");
    cy.get(appNavigationLocators.userProfileDropdownButton).should("exist");
  });

  it("5. Share button should open the share modal, edit button should take us back to the editor, and clicking on user profile button should open up the dropdown menu", () => {
    // Share
    cy.get(
      `${appNavigationLocators.sidebar} ${appNavigationLocators.shareButton}`,
    ).click();
    cy.wait(1000);
    cy.get(appNavigationLocators.modal).should("exist");
    cy.get(appNavigationLocators.modalClose).first().click({ force: true });

    // Edit
    cy.get(
      `${appNavigationLocators.sidebar} ${appNavigationLocators.editButton}`,
    ).click();
    cy.get(commonLocators.canvas).should("exist");

    // User profile dropdown
    deployMode.DeployApp();
    cy.get(appNavigationLocators.userProfileDropdownButton).click();
    cy.get(appNavigationLocators.userProfileDropdownMenu).should("exist");

    // Back to editor
    cy.get(
      `${appNavigationLocators.sidebar} ${appNavigationLocators.editButton}`,
    ).click({ force: true });
  });
});
