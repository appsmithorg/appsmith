const appNavigationLocators = require("../../../../locators/AppNavigation.json");
const commonLocators = require("../../../../locators/commonlocators.json");

import {
  agHelper,
  assertHelper,
  deployMode,
  homePage,
} from "../../../../support/Objects/ObjectsCore";

describe("Test Top + Stacked navigation style", function () {
  before(() => {
    // Import an application
    homePage.NavigateToHome();
    homePage.ImportApp("appNavigationTestingAppWithLongPageNamesAndTitle.json");
    assertHelper
      .WaitForNetworkCall("importNewApplication")
      .then((interception: any) => {
        agHelper.Sleep();
        const { isPartialImport } = interception.response.body.data;
        if (isPartialImport) {
          homePage.AssertNCloseImport();
        } else {
          homePage.AssertImportToast(0);
        }
      });
  });

  it("1. In an app with 15 pages, the navbar should be scrollable", () => {
    const pageName = "Page9 - with long long name";
    deployMode.DeployApp();
    agHelper.AssertElementLength(appNavigationLocators.scrollArrows, 2);
    agHelper.AssertElementVisible(appNavigationLocators.scrollArrows, 1);
    agHelper
      .GetElement(appNavigationLocators.navigationMenuItem)
      .contains(pageName)
      .should("not.be.visible");
    agHelper.GetNClickByContains(
      appNavigationLocators.navigationMenuItem,
      pageName,
      0,
      true,
    );
    agHelper
      .GetElement(appNavigationLocators.navigationMenuItem)
      .contains(pageName)
      .should("be.visible");
    deployMode.NavigateBacktoEditor();
  });

  it("2. Page change should work", () => {
    const pageName = "Page1 - with long long name";
    deployMode.DeployApp();
    agHelper.GetNClickByContains(
      appNavigationLocators.navigationMenuItem,
      pageName,
      0,
      true,
    );
    agHelper
      .GetElement(appNavigationLocators.navigationMenuItem)
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
    agHelper.GetNClickByContains(
      appNavigationLocators.navigationMenuItem,
      pageName,
      0,
      true,
    );

    // Check for scroll arrows
    agHelper.AssertElementLength(appNavigationLocators.scrollArrows, 2);

    // Scroll to the right and page 1 should not be visible
    agHelper
      .GetElement(appNavigationLocators.navigationMenuItem)
      .contains(pageName)
      .should("be.visible");
    agHelper
      .GetElement(appNavigationLocators.scrollArrows)
      .last()
      .trigger("mousedown");
    agHelper.Sleep(1500);
    agHelper
      .GetElement(appNavigationLocators.scrollArrows)
      .last()
      .trigger("mouseup", { force: true });
    agHelper
      .GetElement(appNavigationLocators.navigationMenuItem)
      .contains(pageName)
      .should("not.be.visible");

    // Scroll to the left again and page 1 should be visible
    agHelper
      .GetElement(appNavigationLocators.scrollArrows)
      .first()
      .trigger("mousedown");
    agHelper.Sleep(1500);
    agHelper
      .GetElement(appNavigationLocators.scrollArrows)
      .first()
      .trigger("mouseup", { force: true });
    agHelper
      .GetElement(appNavigationLocators.navigationMenuItem)
      .contains(pageName)
      .should("be.visible");
  });

  it("4. Navigation's background should be default to white, and should change when background color is set to theme", () => {
    // The background should be white since light color style is default
    agHelper
      .GetElement(appNavigationLocators.topStacked)
      .should("have.css", "background-color", "rgb(255, 255, 255)");

    // Changing color style to theme should change navigation's background color
    deployMode.NavigateBacktoEditor();
    agHelper.GetNClick(appNavigationLocators.appSettingsButton);
    agHelper.GetNClick(appNavigationLocators.navigationSettingsTab);
    agHelper.GetNClick(
      appNavigationLocators.navigationSettings.colorStyleOptions.theme,
      0,
      true,
    );
    deployMode.DeployApp();
    agHelper
      .GetElement(appNavigationLocators.topStacked)
      .should("have.css", "background-color", "rgb(85, 61, 233)");
  });

  it("5. Application name, share button, edit button, and user dropdown should be available in the app header", () => {
    agHelper.AssertElementExist(appNavigationLocators.applicationName);
    agHelper.AssertElementExist(appNavigationLocators.shareButton);
    agHelper.AssertElementExist(appNavigationLocators.editButton);
    agHelper.AssertElementExist(
      appNavigationLocators.userProfileDropdownButton,
    );
  });

  it("6. Share button should open the share modal, edit button should take us back to the editor, and clicking on user profile button should open up the dropdown menu", () => {
    // Share
    agHelper.GetNClick(
      `${appNavigationLocators.header} ${appNavigationLocators.shareButton}`,
    );
    agHelper.Sleep(1000);
    agHelper.AssertElementExist(appNavigationLocators.modal);
    agHelper.GetNClick(appNavigationLocators.modalClose, 0, true);

    // Edit
    agHelper.GetNClick(
      `${appNavigationLocators.header} ${appNavigationLocators.editButton}`,
    );
    agHelper.AssertElementExist(commonLocators.canvas);

    // User profile dropdown
    deployMode.DeployApp();
    agHelper.GetNClick(appNavigationLocators.userProfileDropdownButton);
    agHelper.AssertElementExist(appNavigationLocators.userProfileDropdownMenu);
  });
});
