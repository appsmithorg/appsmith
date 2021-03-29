const commonlocators = require("../../../../locators/commonlocators.json");
const viewWidgetsPage = require("../../../../locators/ViewWidgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/displayWidgetDsl.json");
const pages = require("../../../../locators/Pages.json");

describe("Image Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Image Widget Functionality", function() {
    cy.openPropertyPane("imagewidget");
    /**
     * @param{Text} Random Text
     * @param{ImageWidget}Mouseover
     * @param{ImagePre Css} Assertion
     */
    cy.widgetText(
      "img",
      viewWidgetsPage.imageWidget,
      viewWidgetsPage.imagecontainer,
    );
    cy.get(viewWidgetsPage.defaultImage)
      .click({ force: true })
      .type(this.data.command)
      .type(this.data.defaultimage);
    /**
     * @param{URL} ImageUrl
     */
    cy.testCodeMirror(this.data.NewImage);
    cy.get(viewWidgetsPage.imageinner)
      .invoke("attr", "src")
      .should("contain", this.data.validateImage);

    //Zoom validation
    cy.changeZoomLevel("2x");
    cy.get(commonlocators.editPropCrossButton).click({ force: true });
    cy.get(commonlocators.imgWidget)
      .invoke("attr", "style")
      .should("contain", "zoom-in");
    cy.get(commonlocators.imgWidget).click();
    cy.get(commonlocators.imgWidget).click();
    cy.get(commonlocators.imgWidget).click();
    cy.get(commonlocators.imgWidget)
      .invoke("attr", "style")
      .should("not.contain", "zoom-in");
    cy.get(commonlocators.imgWidget)
      .invoke("attr", "style")
      .should("contain", "zoom-out");
    cy.get(commonlocators.imgWidget).click();
    cy.get(commonlocators.imgWidget)
      .invoke("attr", "style")
      .should("contain", "zoom-in");

    cy.PublishtheApp();
  });
  it("Image Widget Functionality To Validate Image", function() {
    cy.get(publish.imageWidget + " " + "img")
      .invoke("attr", "src")
      .should("contain", this.data.validateImage);
  });
  it("Image Widget Functionality To Unchecked Visible Widget", function() {
    cy.get(publish.backToEditor).click();
    cy.openPropertyPane("imagewidget");
    cy.togglebarDisable(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publish.imageWidget).should("not.exist");
    cy.get(publish.backToEditor).click();
  });
  it("Image Widget Functionality To Check Visible Widget", function() {
    cy.openPropertyPane("imagewidget");
    cy.togglebar(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publish.imageWidget).should("be.visible");
  });
});
afterEach(() => {
  // put your clean up code if any
});
