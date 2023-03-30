const appNavigationLocators = require("../../../../locators/AppNavigation.json");
const commonLocators = require("../../../../locators/commonlocators.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const deployMode = ObjectsRegistry.DeployMode;
const agHelper = ObjectsRegistry.AggregateHelper;
const homePage = ObjectsRegistry.HomePage;

describe("Test Top + Inline navigation style", function () {
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

  it("1. Change 'Orientation' to 'Top', and 'Nav style' to 'Inline', page navigation items should appear inline", () => {
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
  });

  it("2. More button should exist and when clicked on it, it should open the dropdown with rest of the pages", () => {
    // 'More' button should exist
    cy.get(appNavigationLocators.topInlineMoreButton).should("exist");

    // Should open the dropdown
    cy.get(appNavigationLocators.topInlineMoreButton).click({ force: true });
    cy.get(appNavigationLocators.topInlineMoreDropdown).should("exist");
    cy.get(appNavigationLocators.topInlineMoreDropdown).should(
      "have.class",
      "bp3-overlay-open",
    );
    cy.get(appNavigationLocators.topInlineMoreDropdownItem).should("exist");
    cy.get(appNavigationLocators.topInlineMoreDropdownItem).should(
      "have.length.of.at.least",
      1,
    );
  });

  it("3. Page change from inside this dropdown should work", () => {
    const pageName = "Page5 - with long long name";

    cy.get(appNavigationLocators.topInlineMoreDropdownItem)
      .contains(pageName)
      .click({ force: true });

    // dropdown should close after page change
    cy.get(appNavigationLocators.topInlineMoreDropdown).should(
      "not.have.class",
      "bp3-overlay-open",
    );

    // open the dropdown again
    cy.get(appNavigationLocators.topInlineMoreButton).click({ force: true });

    // verify that the current page is active
    cy.get(appNavigationLocators.topInlineMoreDropdownItem)
      .contains(pageName)
      .parent()
      .parent()
      .parent()
      .parent()
      .parent()
      .should("have.class", "is-active");
  });

  it("4. Page change should work", () => {
    const pageName = "Page1 - with long long name";

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

  it("5. Navigation's background should be default to white, and should change when background color is set to theme", () => {
    // The background should be white since light color style is default
    cy.get(appNavigationLocators.header).should(
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
    cy.get(appNavigationLocators.header).should(
      "have.css",
      "background-color",
      "rgb(85, 61, 233)",
    );
  });

  it("6. Application name, share button, edit button, and user dropdown should be available in the app header", () => {
    cy.get(appNavigationLocators.applicationName).should("exist");
    cy.get(appNavigationLocators.shareButton).should("exist");
    cy.get(appNavigationLocators.editButton).should("exist");
    cy.get(appNavigationLocators.userProfileDropdownButton).should("exist");
  });

  it("7. Share button should open the share modal, edit button should take us back to the editor, and clicking on user profile button should open up the dropdown menu", () => {
    // Share
    cy.get(
      `${appNavigationLocators.header} ${appNavigationLocators.shareButton}`,
    ).click();
    cy.wait(1000);
    cy.get(appNavigationLocators.modal).should("exist");
    cy.get(appNavigationLocators.modalClose).first().click({ force: true });

    // Edit
    cy.get(
      `${appNavigationLocators.header} ${appNavigationLocators.editButton}`,
    ).click();
    cy.get(commonLocators.canvas).should("exist");

    // User profile dropdown
    deployMode.DeployApp();
    cy.get(appNavigationLocators.userProfileDropdownButton).click();
    cy.get(appNavigationLocators.userProfileDropdownMenu).should("exist");

    // Back to editor
    deployMode.NavigateBacktoEditor();
  });
});
