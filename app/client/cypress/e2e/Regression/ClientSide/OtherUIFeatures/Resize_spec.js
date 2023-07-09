const commonlocators = require("../../../../locators/commonlocators.json");
import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Canvas Resize", function () {
  before(() => {
    _.agHelper.AddDsl("CanvasResizeDsl");
  });
  it("1. Deleting bottom widget should resize canvas", function () {
    const InitHeight = "2950px";
    cy.get(commonlocators.dropTarget).should("have.css", "height", InitHeight);
    //cy.openPropertyPane("textwidget");
    cy.intercept("PUT", "/api/v1/layouts/*/pages/*").as("deleteUpdate");
    _.propPane.DeleteWidgetFromPropertyPane("Text2");
    cy.wait("@deleteUpdate").then((response) => {
      const dsl = response.response.body.data.dsl;
      cy.get(commonlocators.dropTarget).should(
        "have.css",
        "height",
        `${dsl.minHeight - 12}px`, // Reducing 12 px for container padding.
      );
    });
  });
});
