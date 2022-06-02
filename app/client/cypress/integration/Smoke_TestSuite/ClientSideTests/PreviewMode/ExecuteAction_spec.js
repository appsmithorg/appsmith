const homePage = require("../../../../locators/HomePage");

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

  it.skip("checks whether execute action is getting called on page load only once", function() {
    // Deploying the application
    cy.get(homePage.deployPopupOptionTrigger).click();
    cy.get(homePage.currentDeployedPreviewBtn).click({ force: true });

    cy.wait("@postExecute").then((interception) => {
      console.log({ interception });
    });
  });
});
