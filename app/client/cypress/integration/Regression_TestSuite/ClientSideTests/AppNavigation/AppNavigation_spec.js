const appNavigationLocators = require("../../../../locators/AppNavigation.json");
const commonLocators = require("../../../../locators/commonlocators.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const deployMode = ObjectsRegistry.DeployMode;
const agHelper = ObjectsRegistry.AggregateHelper;
const homePage = ObjectsRegistry.HomePage;

describe("General checks for app navigation", function () {
  it("1. App header should appear when there is a single page in the application, and navigation should appear alongside app header when there are two pages", () => {
    // App header should appear when there is a single page in the application
    deployMode.DeployApp();
    cy.get(appNavigationLocators.header).should("exist");
    deployMode.NavigateBacktoEditor();

    // Navigation should appear alongside app header when there are two pages
    cy.Createpage("Page 2");
    deployMode.DeployApp();
    cy.get(appNavigationLocators.topStacked).should("exist");
  });

  it("2. Application name, share button, edit button, and user dropdown should be available in the app header", () => {
    cy.get(appNavigationLocators.applicationName).should("exist");
    cy.get(appNavigationLocators.shareButton).should("exist");
    cy.get(appNavigationLocators.editButton).should("exist");
    cy.get(appNavigationLocators.userProfileDropdownButton).should("exist");
  });

  it("3. Share button should open the share modal, edit button should take us back to the editor, and clicking on user profile button should open up the dropdown menu", () => {
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
    deployMode.NavigateBacktoEditor();
  });

  it("4. Import an application, deploy and verify if the Top+Stacked navigation style shows up with all the pages and a page change happens", () => {
    // Import an application
    homePage.NavigateToHome();
    homePage.ImportApp("appNavigationTestingApp.json");

    cy.wait("@importNewApplication").then((interception) => {
      agHelper.Sleep();

      const { isPartialImport } = interception.response.body.data;

      if (isPartialImport) {
        homePage.AssertNCloseImport();
      } else {
        homePage.AssertImportToast();
      }

      deployMode.DeployApp();

      // Assert app header, top stacked navigation and page menu items
      cy.get(appNavigationLocators.header).should("exist");
      cy.get(appNavigationLocators.topStacked).should("exist");
      cy.get(appNavigationLocators.navigationMenuItem).should(
        "have.length",
        10,
      );

      // Switch page
      cy.get(appNavigationLocators.navigationMenuItem)
        .contains("Page5")
        .click({ force: true });

      // Assert active page menu item
      cy.get(appNavigationLocators.navigationMenuItem)
        .contains("Page5")
        .parent()
        .parent()
        .parent()
        .parent()
        .parent()
        .should("have.class", "is-active");
      deployMode.NavigateBacktoEditor();
    });
  });
});
