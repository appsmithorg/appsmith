import homePage from "../../../../locators/HomePage";

describe("Execute Action Functionality", function() {
  before(() => {
    cy.get(homePage.homeIcon).click();
    cy.get(homePage.optionsIcon)
      .first()
      .click();
    // Importing the App from the sample application
    cy.get(homePage.workspaceImportAppOption).click({ force: true });
    cy.get(homePage.workspaceImportAppModal).should("be.visible");
    cy.xpath(homePage.uploadLogo).attachFile("executeAction.json");
    cy.get(homePage.importAppProgressWrapper).should("be.visible");
    cy.wait(3000);
  });

  it("1. Checks whether execute action is getting called on page load only once", function() {
    // Open deployed version
    cy.get(".t--draggable-textwidget").should("be.visible");

    // cy.get(homePage.deployPopupOptionTrigger).click({ force: true });
    // cy.get(homePage.currentDeployedPreviewBtn)
    //   .invoke("removeAttr", "target")
    //   .click();

    cy.PublishtheApp();
    cy.get(".t--widget-textwidget").contains("User count :5");

    let completedIds = [];

    cy.get("@postExecute.all")
      .then((respBody) => {
        const totalRequests = [
          ...new Set(respBody.map((req) => req.browserRequestId)),
        ];
        completedIds = totalRequests;
        return totalRequests;
      })
      .should("have.length", 2); //Count from Initial Import + Deployed Mode - Page 1 execute call - hence count 2
    cy.wait(500);

    cy.get(".t--page-switch-tab")
      .contains("Page2")
      .click({ force: true });
    cy.get(".t--widget-textwidget").contains("User count :10");

    cy.get("@postExecute.all")
      .then((respBody) => {
        const totalRequests = [
          ...new Set(respBody.map((req) => req.browserRequestId)),
        ];
        return totalRequests.filter((reqId) => !completedIds.includes(reqId));
      })
      .should("have.length", 1); // Since Page 2 is switched - previous count is washed out, and this is only call

    cy.get(".t--page-switch-tab")
      .contains("Page1")
      .click({ force: true });
    cy.get(".t--widget-textwidget").contains("User count :5");

    cy.get("@postExecute.all")
      .then((respBody) => {
        const totalRequests = [
          ...new Set(respBody.map((req) => req.browserRequestId)),
        ];
        return totalRequests.filter((reqId) => !completedIds.includes(reqId));
      })
      .should("have.length", 2); // Since its within deployed page, switching to Page 1 , adds one more to previous count!
  });
});
