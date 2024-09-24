const appNavigationLocators = require("../../../../locators/AppNavigation.json");
import {
  agHelper,
  deployMode,
  draggableWidgets,
  locators,
} from "../../../../support/Objects/ObjectsCore";

Cypress.Commands.add("setSharedUrl", (url) => {
  Cypress.sharedStore = { url };
});

Cypress.Commands.add("getSharedUrl", () => {
  return Cypress.sharedStore.url;
});

describe("Preview mode functionality", { tags: ["@tag.IDE"] }, () => {
  before(() => {
    agHelper.AddDsl("previewMode");
    deployMode.DeployApp();
    cy.url().then((url) => cy.setSharedUrl(url));
  });

  beforeEach(() => {
    cy.getSharedUrl().then((url) => {
      agHelper.VisitNAssert(url, "getConsolidatedData"),
        agHelper.AssertElementVisibility(
          locators._widgetInDeployed(draggableWidgets.BUTTON),
        );
    });
  });

  it("1. on click of apps on header, it should take to application home page", function () {
    cy.get(appNavigationLocators.userProfileDropdownButton).should("exist");
    cy.get(
      `${appNavigationLocators.header} ${appNavigationLocators.backToAppsButton}`,
    ).click();
    agHelper.AssertURL(Cypress.config().baseUrl + "applications");
  });

  it("2. In the published app with embed=true, there should be no header", function () {
    cy.url().then((url) => {
      url = new URL(url);
      url.searchParams.append("embed", "true");
      agHelper.VisitNAssert(url.toString(), "getConsolidatedData");
      agHelper.AssertElementVisibility(
        locators._widgetInDeployed(draggableWidgets.BUTTON),
      );
    });
    agHelper.AssertElementAbsence(appNavigationLocators.header);
  });

  it("3. In the published app with embed=true&navbar=true, navigator should be visible without user settings", function () {
    cy.url().then((url) => {
      url = new URL(url);
      url.searchParams.append("embed", "true");
      url.searchParams.append("navbar", "true");
      agHelper.VisitNAssert(url.toString(), "getConsolidatedData");
      agHelper.AssertElementVisibility(
        locators._widgetInDeployed(draggableWidgets.BUTTON),
      );
    });
    agHelper.AssertElementVisibility(appNavigationLocators.header);
    agHelper.AssertElementAbsence(
      appNavigationLocators.userProfileDropdownButton,
    );
  });
});
