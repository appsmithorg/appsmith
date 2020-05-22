const commonlocators = require("../../../locators/commonlocators.json");
const viewWidgetsPage = require("../../../locators/ViewWidgets.json");
const dsl = require("../../../fixtures/viewdsl.json");

describe("Image Widget Functionality", function() {
  beforeEach(() => {
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
    cy.get(commonlocators.editPropCrossButton).click();
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
