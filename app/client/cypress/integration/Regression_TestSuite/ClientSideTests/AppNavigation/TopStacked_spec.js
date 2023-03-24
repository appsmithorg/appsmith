const appNavigationLocators = require("../../../../locators/AppNavigation.json");
const commonLocators = require("../../../../locators/commonlocators.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const deployMode = ObjectsRegistry.DeployMode;
const agHelper = ObjectsRegistry.AggregateHelper;
const homePage = ObjectsRegistry.HomePage;

describe("Test Top + Stacked navigation style", function () {
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

  it("1. In an app with 15 pages, the navbar should be scrollable", () => {
    const pageName = "Page9 - with long long name";

    deployMode.DeployApp();
    cy.get(appNavigationLocators.scrollArrows).should("have.length", 2);
    cy.get(appNavigationLocators.scrollArrows).last().should("be.visible");
    cy.get(appNavigationLocators.navigationMenuItem)
      .contains(pageName)
      .should("not.be.visible");
    cy.get(appNavigationLocators.navigationMenuItem)
      .contains(pageName)
      .click({ force: true });
    cy.get(appNavigationLocators.navigationMenuItem)
      .contains(pageName)
      .should("be.visible");
    deployMode.NavigateBacktoEditor();
  });

  it("2. Page change should work", () => {
    const pageName = "Page1 - with long long name";
    deployMode.DeployApp();
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

  it("3. Left and right scroll arrows should work", () => {
    const pageName = "Page1 - with long long name";

    // Navigate to Page1
    cy.get(appNavigationLocators.navigationMenuItem)
      .contains(pageName)
      .click({ force: true });

    // Check for scroll arrows
    cy.get(appNavigationLocators.scrollArrows).should("have.length", 2);

    // Scroll to the right and page 1 should not be visible
    cy.get(appNavigationLocators.navigationMenuItem)
      .contains(pageName)
      .should("be.visible");
    cy.get(appNavigationLocators.scrollArrows).last().trigger("mousedown");
    cy.wait(2000);
    cy.get(appNavigationLocators.scrollArrows).last().trigger("mouseup");
    cy.get(appNavigationLocators.navigationMenuItem)
      .contains(pageName)
      .should("not.be.visible");

    // Scroll to the left again and page 1 should be visible
    cy.get(appNavigationLocators.navigationMenuItem)
      .contains(pageName)
      .should("not.be.visible");
    cy.get(appNavigationLocators.scrollArrows).first().trigger("mousedown");
    cy.wait(2000);
    cy.get(appNavigationLocators.scrollArrows).first().trigger("mouseup");
    cy.get(appNavigationLocators.navigationMenuItem)
      .contains(pageName)
      .should("be.visible");
  });

  it("4. The background of nav should be white since light color style is default", () => {
    cy.get(appNavigationLocators.topStacked).should(
      "have.css",
      "background-color",
      "rgb(255, 255, 255)",
    );
  });

  it("5. Application name, share button, edit button, and user dropdown should be available in the app header", () => {
    cy.get(appNavigationLocators.applicationName).should("exist");
    cy.get(appNavigationLocators.shareButton).should("exist");
    cy.get(appNavigationLocators.editButton).should("exist");
    cy.get(appNavigationLocators.userProfileDropdownButton).should("exist");
  });

  it("6. Share button should open the share modal", () => {
    cy.get(
      `${appNavigationLocators.header} ${appNavigationLocators.shareButton}`,
    ).click();
    cy.wait(1000);
    cy.get(appNavigationLocators.modal).should("exist");
    cy.get(appNavigationLocators.modalClose).first().click({ force: true });
  });

  it("7. Edit button should take us back to the editor", () => {
    cy.get(
      `${appNavigationLocators.header} ${appNavigationLocators.editButton}`,
    ).click();
    cy.get(commonLocators.canvas).should("exist");
  });

  it("8. Clicking on user profile button should open up the dropdown menu", () => {
    deployMode.DeployApp();
    cy.get(appNavigationLocators.userProfileDropdownButton).click();
    cy.get(appNavigationLocators.userProfileDropdownMenu).should("exist");
    deployMode.NavigateBacktoEditor();
  });

  it("9. Changing color style to theme should change navigation's background color", () => {
    cy.get(appNavigationLocators.appSettingsButton).click();
    cy.get(appNavigationLocators.navigationSettingsTab).click();
    cy.get(
      appNavigationLocators.navigationSettings.colorStyleOptions.theme,
    ).click({
      force: true,
    });
    deployMode.DeployApp();
    cy.get(appNavigationLocators.topStacked).should(
      "have.css",
      "background-color",
      "rgb(85, 61, 233)",
    );
    deployMode.NavigateBacktoEditor();
  });
});
