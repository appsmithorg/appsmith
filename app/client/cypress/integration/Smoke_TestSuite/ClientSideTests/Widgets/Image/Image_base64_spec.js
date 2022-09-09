const viewWidgetsPage = require("../../../../../locators/ViewWidgets.json");
const dsl = require("../../../../../fixtures/base64imagedsl.json");

describe("Image Widget Functionality with base64", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Image Widget Functionality Base64 validation", function() {
    cy.openPropertyPane("imagewidget");
    /**
     * Test for Base64 encoded image
     */
    cy.testJsontext("image", this.data.base64image.withoutPrefix);
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
