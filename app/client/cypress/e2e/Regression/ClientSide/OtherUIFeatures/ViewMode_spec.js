const appNavigationLocators = require("../../../../locators/AppNavigation.json");
import { agHelper, deployMode } from "../../../../support/Objects/ObjectsCore";

const BASE_URL = Cypress.config().baseUrl;

Cypress.Commands.add("setSharedUrl", (url) => {
  Cypress.sharedStore = { url };
});

Cypress.Commands.add("getSharedUrl", () => {
  return Cypress.sharedStore.url;
});

describe("Preview mode functionality", function () {
  before(() => {
    agHelper.AddDsl("previewMode");
    deployMode.DeployApp();
    cy.url().then((url) => cy.setSharedUrl(url));
  });

  beforeEach(() => {
    cy.getSharedUrl().then((url) => cy.visit(url, { timeout: 60000 }));
  });

  it("1. on click of apps on header, it should take to application home page", function () {
    cy.get(appNavigationLocators.userProfileDropdownButton).should("exist");
    cy.get(
      `${appNavigationLocators.header} ${appNavigationLocators.backToAppsButton}`,
    ).click();
    cy.url().should("eq", BASE_URL + "applications");
  });

  it("2. In the published app with embed=true, there should be no header", function () {
    cy.url().then((url) => {
      url = new URL(url);
      url.searchParams.append("embed", "true");
      cy.visit(url.toString(), { timeout: 60000 });
    });
    cy.get(appNavigationLocators.header).should("not.exist");
  });

  it("3. In the published app with embed=true&navbar=true, navigator should be visible without user settings", function () {
    cy.url().then((url) => {
      url = new URL(url);
      url.searchParams.append("embed", "true");
      url.searchParams.append("navbar", "true");
      cy.visit(url.toString(), { timeout: 60000 });
    });
    cy.get(appNavigationLocators.header).should("exist");
    cy.get(appNavigationLocators.userProfileDropdownButton).should("not.exist");
  });
});
