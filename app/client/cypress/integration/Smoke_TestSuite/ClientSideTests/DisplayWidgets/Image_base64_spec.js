const commonlocators = require("../../../../locators/commonlocators.json");
const viewWidgetsPage = require("../../../../locators/ViewWidgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/base64imagedsl.json");
const pages = require("../../../../locators/Pages.json");

describe("Image Widget Functionality with base64", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Image Widget Functionality Base64 validation", function() {
    cy.openPropertyPane("imagewidget");
    /**
     * Test for Base64 encoded image
     */
    cy.get(viewWidgetsPage.sourceImage)
      .click({ force: true })
      .type(this.data.base64image.withoutPrefix);
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.EvaluateCurrentValue(this.data.base64image.withPrefix);
    cy.get(viewWidgetsPage.imageinner)
      .invoke("attr", "src")
      .should("contain", this.data.base64image.withPrefix);
    cy.closePropertyPane();
  });
});

afterEach(() => {
  // put your clean up code if any
});
