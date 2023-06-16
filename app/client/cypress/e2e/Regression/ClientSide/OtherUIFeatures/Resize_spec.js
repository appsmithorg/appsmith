const commonlocators = require("../../../../locators/commonlocators.json");
import {
  entityExplorer,
  propPane,
  agHelper,
} from "../../../../support/Objects/ObjectsCore";

describe("Canvas Resize", function () {
  before(() => {
    cy.fixture("CanvasResizeDsl").then((val) => {
      agHelper.AddDsl(val);
    });
  });
  it("1. Deleting bottom widget should resize canvas", function () {
    const InitHeight = "2950px";
    cy.get(commonlocators.dropTarget).should("have.css", "height", InitHeight);
    entityExplorer.SelectEntityByName("Text2");
    cy.intercept("PUT", "/api/v1/layouts/*/pages/*").as("deleteUpdate");
    propPane.DeleteWidgetFromPropertyPane("Text2");
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
