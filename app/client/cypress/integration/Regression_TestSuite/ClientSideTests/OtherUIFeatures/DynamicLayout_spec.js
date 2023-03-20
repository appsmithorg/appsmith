const commonlocators = require("../../../../locators/commonlocators.json");
const pages = require("../../../../locators/Pages.json");

describe("Dynamic Layout Functionality", function () {
  it("Dynamic Layout - Change Layout", function () {
    cy.get(commonlocators.layoutControls).last().click();
    cy.get(commonlocators.canvas).invoke("width").should("be.eq", 450);
  });
  it("Dynamic Layout - New Page should have selected Layout", function () {
    cy.get(pages.AddPage).first().click();

    cy.get(commonlocators.canvas).invoke("width").should("be.eq", 450);
  });
});
