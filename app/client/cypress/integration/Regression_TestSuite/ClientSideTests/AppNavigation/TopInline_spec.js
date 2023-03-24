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

  it("2. 'More' button should exist", () => {
    cy.get(appNavigationLocators.topInlineMoreButton).should("exist");
  });

  it("3. When clicked on 'More' button, it should open the dropdown with rest of the pages", () => {
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

  it("4. Page change from inside this dropdown should work", () => {
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

  it("5. Page change should work", () => {
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

  it("6. The background of nav should be white since light color style is default", () => {
    cy.get(appNavigationLocators.header).should(
      "have.css",
      "background-color",
      "rgb(255, 255, 255)",
    );
  });

  it("7. Changing color style to theme should change navigation's background color", () => {
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

  it("8. Application name, share button, edit button, and user dropdown should be available in the app header", () => {
    cy.get(appNavigationLocators.applicationName).should("exist");
    cy.get(appNavigationLocators.shareButton).should("exist");
    cy.get(appNavigationLocators.editButton).should("exist");
    cy.get(appNavigationLocators.userProfileDropdownButton).should("exist");
  });

  it("9. Share button should open the share modal", () => {
    cy.get(
      `${appNavigationLocators.header} ${appNavigationLocators.shareButton}`,
    ).click();
    cy.wait(1000);
    cy.get(appNavigationLocators.modal).should("exist");
    cy.get(appNavigationLocators.modalClose).first().click({ force: true });
  });

  it("10. Edit button should take us back to the editor", () => {
    cy.get(
      `${appNavigationLocators.header} ${appNavigationLocators.editButton}`,
    ).click();
    cy.get(commonLocators.canvas).should("exist");
  });

  it("11. Clicking on user profile button should open up the dropdown menu", () => {
    deployMode.DeployApp();
    cy.get(appNavigationLocators.userProfileDropdownButton).click();
    cy.get(appNavigationLocators.userProfileDropdownMenu).should("exist");
    deployMode.NavigateBacktoEditor();
  });
});
