const dsl = require("../../../../fixtures/previewMode.json");
const appNavigationLocators = require("../../../../locators/AppNavigation.json");
import * as _ from "../../../../support/Objects/ObjectsCore";

const BASE_URL = Cypress.config().baseUrl;

describe("Preview mode functionality", function () {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. on click of apps on header, it should take to application home page", function () {
    _.deployMode.DeployApp();
    cy.get(
      `${appNavigationLocators.header} ${appNavigationLocators.backToAppsButton}`,
    ).click();
    cy.url().should("eq", BASE_URL + "applications");
  });
});
