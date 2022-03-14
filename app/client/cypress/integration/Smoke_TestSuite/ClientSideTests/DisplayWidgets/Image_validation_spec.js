const commonlocators = require("../../../../locators/commonlocators.json");
const viewWidgetsPage = require("../../../../locators/ViewWidgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/displayWidgetDsl.json");
const pages = require("../../../../locators/Pages.json");

describe("Image Widget Validation Image Urls", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Check default image and new image", function() {
    cy.openPropertyPane("imagewidget");
    cy.testJsontext("defaultimage", this.data.defaultimage);
    cy.get(viewWidgetsPage.imageinner)
      .invoke("attr", "src")
      .should("contain", this.data.defaultimage);

    cy.testCodeMirror(this.data.NewImage);
    cy.get(viewWidgetsPage.imageinner)
      .invoke("attr", "src")
      .should("contain", this.data.NewImage)
      .should("not.contain", this.data.defaultimage);
    cy.closePropertyPane();
  });

  it("Remove both images and check empty screen", function() {
    cy.openPropertyPane("imagewidget");

    cy.clearPropertyValue(0);
    cy.clearPropertyValue(1);

    cy.get(
      `${viewWidgetsPage.imageWidget} div[data-testid=error-container]`,
    ).should("not.exist");
    cy.get(
      `${viewWidgetsPage.imageWidget} div[data-testid=styledImage]`,
    ).should("exist");

    cy.get(viewWidgetsPage.imageinner)
      .invoke("attr", "src")
      .should("contain", "");
  });

  it("Add new image and check image src", function() {
    cy.testCodeMirror(this.data.NewImage);
    // if imageError flag not reset properly, this test will fail.
    cy.get(viewWidgetsPage.imageinner)
      .invoke("attr", "src")
      .should("contain", this.data.NewImage);
    // error container doesn't exist
    cy.get(
      `${viewWidgetsPage.imageWidget} div[data-testid=error-container]`,
    ).should("not.exist");
  });
});
