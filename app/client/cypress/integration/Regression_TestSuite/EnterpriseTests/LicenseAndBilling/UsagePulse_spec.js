import homePage from "../../../../locators/HomePage";

describe("excludeForAirgap", "Usage pulse", function () {
  beforeEach(() => {
    cy.intercept("POST", "/api/v1/usage-pulse").as("usagePulse");
  });
  it("1. Should send usage pulse", function () {
    cy.visit("/applications");
    cy.wait(2000);
    cy.get(homePage.applicationCard).first().trigger("mouseover");
    cy.get(homePage.appEditIcon).should("exist");
    cy.get(homePage.appEditIcon).click();
    cy.reload();
    cy.wait("@usagePulse").then((result) => {
      const payload = result.request.body;
      expect(payload).to.have.property("viewMode", false);
    });
  });
  it("2. Should send view mode as true when in deployed application", function () {
    cy.get(homePage.shareApp).click();
    cy.enablePublicAccess(true);
    cy.window().then((window) => {
      cy.stub(window, "open").callsFake((url) => {
        window.location.href = Cypress.config().baseUrl + url.substring(1);
        window.location.target = "_self";
      });
    });
    cy.get(homePage.publishButton).click();
    cy.wait("@publishApp");
    cy.reload();
    cy.wait("@usagePulse").then((result) => {
      const payload = result.request.body;
      expect(payload).to.have.property("viewMode", true);
    });
  });
});
