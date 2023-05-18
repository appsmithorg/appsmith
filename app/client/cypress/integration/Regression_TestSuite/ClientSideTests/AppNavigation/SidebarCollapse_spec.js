const appNavigationLocators = require("../../../../locators/AppNavigation.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const deployMode = ObjectsRegistry.DeployMode;

describe("Test Sidebar Collapse", function () {
  it("1. Sidebar collapse button should be there", () => {
    // First make sure that nav orientation is set to side
    cy.get(appNavigationLocators.appSettingsButton).click();
    cy.get(appNavigationLocators.navigationSettingsTab).click();
    cy.get(
      appNavigationLocators.navigationSettings.orientationOptions.side,
    ).click({
      force: true,
    });
    deployMode.DeployApp();
    cy.get(appNavigationLocators.sidebarCollapseButton).should("exist");
  });

  it("3. Sidebar should collapse and open on click of collapse button again", () => {
    // Collapse
    cy.get(appNavigationLocators.sidebarCollapseButton).click({ force: true });
    cy.get(appNavigationLocators.sidebar).should("not.have.class", "is-open");

    // Open
    cy.get(appNavigationLocators.sidebarCollapseButton).click({ force: true });
    cy.get(appNavigationLocators.sidebar).should("have.class", "is-open");
    // Back to editor
    cy.get(
      `${appNavigationLocators.sidebar} ${appNavigationLocators.editButton}`,
    ).click({ force: true });
  });
});
