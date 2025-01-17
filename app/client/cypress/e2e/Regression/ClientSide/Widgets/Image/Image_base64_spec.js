const viewWidgetsPage = require("../../../../../locators/ViewWidgets.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Image Widget Functionality with base64",
  { tags: ["@tag.All", "@tag.Image", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("base64imagedsl");
    });

    it("Image Widget Functionality Base64 validation", function () {
      cy.openPropertyPane("imagewidget");
      /**
       * Test for Base64 encoded image
       */
      cy.testJsontext("image", this.dataSet.base64image.withoutPrefix);
      cy.wait("@updateLayout").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );
      cy.EvaluateCurrentValue(this.dataSet.base64image.withPrefix);
      cy.get(viewWidgetsPage.imageinner)
        .invoke("attr", "src")
        .should("contain", this.dataSet.base64image.withPrefix);
      cy.closePropertyPane();
    });
  },
);

afterEach(() => {
  // put your clean up code if any
});
