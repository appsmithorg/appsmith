import homePageLocators from "../../../../locators/HomePage";
import {
  agHelper,
  deployMode,
  homePage,
} from "../../../../support/Objects/ObjectsCore";

describe("excludeForAirgap", "Usage pulse", function () {
  beforeEach(() => {
    cy.intercept("POST", "/api/v1/usage-pulse").as("usagePulse");
  });
  it("1. Should send usage pulse", function () {
    agHelper.VisitNAssert("/applications", "getReleaseItems");
    agHelper.Sleep(2000);
    cy.get(homePageLocators.applicationCard).first().trigger("mouseover");
    agHelper.AssertElementVisibility(homePageLocators.appEditIcon);
    homePage.EditAppFromAppHover();
    agHelper.RefreshPage("getReleaseItems");
    cy.wait("@usagePulse").then((result) => {
      const payload = result.request.body;
      expect(payload).to.have.property("viewMode", false);
    });
  });
  it("2. Should send view mode as true when in deployed application", function () {
    agHelper.GetNClick(homePageLocators.shareApp);
    cy.enablePublicAccess(true);
    cy.window().then((window) => {
      cy.stub(window, "open").callsFake((url) => {
        window.location.href = Cypress.config().baseUrl + url.substring(1);
        window.location.target = "_self";
      });
    });
    deployMode.DeployApp();
    agHelper.RefreshPage("viewPage");
    cy.wait("@usagePulse").then((result) => {
      const payload = result.request.body;
      expect(payload).to.have.property("viewMode", true);
    });
  });
});
