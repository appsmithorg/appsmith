const commonlocators = require("../../../locators/commonlocators.json");
const dsl = require("../../../fixtures/CanvasResizeDsl.json");

describe("Canvas Resize", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  it("Deleting bottom widget should resize canvas", function() {
    const InitHeight = "2960px";
    const FinalHeight = "1292px";
    cy.get(commonlocators.dropTarget).should("have.css", "height", InitHeight);
    cy.openPropertyPane("textwidget");
    cy.get(commonlocators.deleteWidget).click();
    cy.get(commonlocators.dropTarget).should("have.css", "height", FinalHeight);
  });
});
