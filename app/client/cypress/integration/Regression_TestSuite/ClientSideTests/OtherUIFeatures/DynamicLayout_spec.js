const widgetsPage = require("../../../../locators/Widgets.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const dsl = require("../../../../fixtures/newFormDsl.json");
import homePage from "../../../../locators/HomePage";
const pages = require("../../../../locators/Pages.json");
const publishPage = require("../../../../locators/publishWidgetspage.json");
const modalWidgetPage = require("../../../../locators/ModalWidget.json");

describe("Dynamic Layout Functionality", function() {
  it("Dynamic Layout - Change Layout", function() {
    cy.get(commonlocators.layoutControls)
      .eq(4)
      .click();
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
