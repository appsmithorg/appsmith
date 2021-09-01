const commonlocators = require("../../../../locators/commonlocators.json");
const dsl = require("../../../../fixtures/CanvasResizeDsl.json");

describe("Canvas Resize", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  it("Deleting bottom widget should resize canvas", function() {
    const InitHeight = "2960px";
    cy.get(commonlocators.dropTarget).should("have.css", "height", InitHeight);
    cy.openPropertyPane("textwidget");
    cy.intercept("PUT", "/api/v1/layouts/*/pages/*").as("deleteUpdate");
    cy.get(commonlocators.deleteWidget).click();
    cy.wait("@deleteUpdate").then((response) => {
      const dsl = response.response.body.data.dsl;
      cy.get(commonlocators.dropTarget).should(
        "have.css",
        "height",
        `${dsl.bottomRow}px`,
      );
    });
  });
});
