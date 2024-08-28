const commonlocators = require("../../../../locators/commonlocators.json");
import PageList from "../../../../support/Pages/PageList";

describe("Dynamic Layout Functionality", function () {
  it("1. Dynamic Layout - Change Layout", function () {
    cy.get(commonlocators.layoutControls).last().click();
    cy.get(commonlocators.canvas).invoke("width").should("be.eq", 450);

    //Dynamic Layout - New Page should have selected Layout
    PageList.AddNewPage();
    cy.get(commonlocators.canvas).invoke("width").should("be.eq", 450);
  });
});
