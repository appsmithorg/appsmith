const widgetsPage = require("../../../../locators/Widgets.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const dsl = require("../../../../fixtures/newFormDsl.json");
const homePage = require("../../../../locators/HomePage.json");
const pages = require("../../../../locators/Pages.json");
const publishPage = require("../../../../locators/publishWidgetspage.json");
const modalWidgetPage = require("../../../../locators/ModalWidget.json");

describe("Dynamic Layout Functionality", function() {
  it("Dynamic Layout - Change Layout", function() {
    cy.get(commonlocators.canvas)
      .invoke("width")
      .should("be.gt", 1024);
    cy.get(commonlocators.layoutControl).click();
    cy.get(commonlocators.layoutPopover)
      .contains("Mobile Device")
      .click({ force: true });
    cy.get(commonlocators.canvas)
      .invoke("width")
      .should("be.eq", 450);
  });
  it("Dynamic Layout - New Page should have selected Layout", function() {
    cy.get(pages.AddPage)
      .first()
      .click();
    cy.get(commonlocators.canvas)
      .invoke("width")
      .should("be.eq", 450);
  });
});
