const viewWidgetsPage = require("../../../../../locators/ViewWidgets.json");
const dsl = require("../../../../../fixtures/displayWidgetDsl.json");

describe("Image Widget Validation Image Urls", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Check default image src", function() {
    cy.openPropertyPane("imagewidget");
    cy.get(viewWidgetsPage.imageinner)
      .invoke("attr", "src")
      .should(
        "contain",
        "https://res.cloudinary.com/drako999/image/upload/v1589196259/default.png",
      );
  });

  it("Add new image and check image is showing instead of default image", function() {
    cy.testCodeMirror(this.data.NewImage);
    cy.get(viewWidgetsPage.imageinner)
      .invoke("attr", "src")
      .should("contain", this.data.NewImage);
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
    cy.closePropertyPane();
  });

  it("Add new image and check image src", function() {
    cy.openPropertyPane("imagewidget");
    cy.clearPropertyValue(0);

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
