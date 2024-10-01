const viewWidgetsPage = require("../../../../../locators/ViewWidgets.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Image Widget Validation Image Urls",
  { tags: ["@tag.Widget", "@tag.Image"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("displayWidgetDsl");
    });

    it("1. Check default image src", function () {
      cy.openPropertyPane("imagewidget");
      cy.get(viewWidgetsPage.imageinner)
        .invoke("attr", "src")
        .should(
          "contain",
          "http://host.docker.internal:4200/clouddefaultImage.png",
        );
    });

    it("2. Add new image and check image is showing instead of default image", function () {
      cy.testCodeMirror(this.dataSet.NewImage);
      cy.get(viewWidgetsPage.imageinner)
        .invoke("attr", "src")
        .should("contain", this.dataSet.NewImage);
      cy.closePropertyPane();
    });

    it("3. Remove both images and check empty screen", function () {
      cy.openPropertyPane("imagewidget");

      cy.get(".t--property-control-image").then(($el) =>
        cy.updateCodeInput($el, ""),
      );
      cy.get(".t--property-control-defaultimage").then(($el) =>
        cy.updateCodeInput($el, ""),
      );

      cy.get(
        `${viewWidgetsPage.imageWidget} div[data-testid=error-container]`,
      ).should("not.exist");
      cy.get(
        `${viewWidgetsPage.imageWidget} div[data-testid=styledImage]`,
      ).should("exist");

      cy.get(viewWidgetsPage.imageinner)
        .invoke("attr", "src")
        .should("contain", "");
      cy.closePropertyPane();
    });

    it("4. Add new image and check image src", function () {
      cy.openPropertyPane("imagewidget");
      cy.clearPropertyValue(0);

      cy.testCodeMirror(this.dataSet.NewImage);
      // if imageError flag not reset properly, this test will fail.
      cy.get(viewWidgetsPage.imageinner)
        .invoke("attr", "src")
        .should("contain", this.dataSet.NewImage);
      // error container doesn't exist
      cy.get(
        `${viewWidgetsPage.imageWidget} div[data-testid=error-container]`,
      ).should("not.exist");
    });
  },
);
