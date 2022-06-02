import homePage from "../../../../locators/HomePage";

describe("Execute Action Functionality", function() {
  before(() => {
    cy.get(homePage.homeIcon).click();
    cy.get(homePage.optionsIcon)
      .first()
      .click();
    // Importing the App from the sample application
    cy.get(homePage.orgImportAppOption).click({ force: true });
    cy.get(homePage.orgImportAppModal).should("be.visible");
    cy.xpath(homePage.uploadLogo).attachFile("executeAction.json");
    cy.get(homePage.importAppProgressWrapper).should("be.visible");
  });

  it("checks whether execute action is getting called on page load only once", function() {
    // Open deployed version
    cy.get(homePage.publishButton).click({ force: true });

    cy.wait("@publishApp");

    cy.get("@postExecute.all")
      .then((respBody) => {
        const totalRequests = [
          ...new Set(respBody.map((req) => req.browserRequestId)),
        ];
        return totalRequests;
      })
      .should("have.length", 1);

    cy.wait(500);

    cy.get(".t--page-switch-tab")
      .contains("Page2")
      .click({ force: true });

    cy.get("@postExecute.all")
      .then((respBody) => {
        const totalRequests = [
          ...new Set(respBody.map((req) => req.browserRequestId)),
        ];
        return totalRequests;
      })
      .should("have.length", 1);
  });
});
