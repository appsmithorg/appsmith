const appNavigationLocators = require("../../../../locators/AppNavigation.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const deployMode = ObjectsRegistry.DeployMode;
const agHelper = ObjectsRegistry.AggregateHelper;

describe("Test app's navigation settings", function () {
  it("1. Open app settings and navigation tab should be there and when the navigation tab is selected, navigation preview should be visible", () => {
    cy.get(appNavigationLocators.appSettingsButton).click();
    cy.get(appNavigationLocators.navigationSettingsTab).should("exist");

    // Should not exist when the tab is not selected
    cy.get(appNavigationLocators.navigationPreview).should("not.exist");
    cy.get(appNavigationLocators.navigationSettingsTab).click();

    // Should exist when the tab is selected
    cy.get(appNavigationLocators.navigationPreview).should("exist");
  });

  it("2. Toggle 'Show navbar' to off, the app header and navigation should not appear when deployed", () => {
    // Toggle show navbar to off
    cy.get(appNavigationLocators.navigationSettings.showNavbar).click({
      force: true,
    });
    cy.PublishtheApp();
    cy.get(appNavigationLocators.header).should("not.exist");
    cy.get(appNavigationLocators.topStacked).should("not.exist");
    cy.go("back");
    // Wait for the app to load
    agHelper.Sleep(3000);
    cy.get(appNavigationLocators.appSettingsButton).click();
    cy.get(appNavigationLocators.navigationSettingsTab).click();
    // Toggle show navbar back to on
    cy.get(appNavigationLocators.navigationSettings.showNavbar).click({
      force: true,
    });
  });

  it("3. Change 'Orientation' to 'Side', deploy, and the sidebar should appear", () => {
    cy.get(
      appNavigationLocators.navigationSettings.orientationOptions.side,
    ).click({
      force: true,
    });
    deployMode.DeployApp();
    cy.get(appNavigationLocators.header).should("not.exist");
    cy.get(appNavigationLocators.topStacked).should("not.exist");
    cy.get(appNavigationLocators.sidebar).should("exist");
    deployMode.NavigateBacktoEditor();
  });

  it("4. Change 'Orientation' back to 'Top', and 'Nav style' to 'Inline', page navigation items should appear inline", () => {
    cy.Createpage("Page 2");
    cy.get(appNavigationLocators.appSettingsButton).click();
    cy.get(appNavigationLocators.navigationSettingsTab).click();
    cy.get(
      appNavigationLocators.navigationSettings.orientationOptions.top,
    ).click({
      force: true,
    });
    cy.get(
      appNavigationLocators.navigationSettings.navStyleOptions.inline,
    ).click({
      force: true,
    });
    deployMode.DeployApp();
    cy.get(appNavigationLocators.header).should("exist");
    cy.get(appNavigationLocators.topStacked).should("not.exist");
    cy.get(appNavigationLocators.topInline).should("exist");
    deployMode.NavigateBacktoEditor();
  });
});
