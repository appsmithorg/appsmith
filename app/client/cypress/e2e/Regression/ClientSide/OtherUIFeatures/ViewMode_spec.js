const appNavigationLocators = require("../../../../locators/AppNavigation.json");
import * as _ from "../../../../support/Objects/ObjectsCore";

const BASE_URL = Cypress.config().baseUrl;

describe("Preview mode functionality", function () {
  before(() => {
    cy.fixture("previewMode").then((val) => {
      _.agHelper.AddDsl(val);
    });
  });

  it("1. on click of apps on header, it should take to application home page", function () {
    _.deployMode.DeployApp();
    cy.get(
      `${appNavigationLocators.header} ${appNavigationLocators.backToAppsButton}`,
    ).click();
    cy.url().should("eq", BASE_URL + "applications");
  });
});
