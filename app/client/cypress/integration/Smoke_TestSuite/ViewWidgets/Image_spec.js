const commonlocators = require("../../../locators/commonlocators.json");
const viewWidgetsPage = require("../../../locators/ViewWidgets.json");
const dsl = require("../../../fixtures/viewdsl.json");

describe("Image Widget Functionality", function() {
  beforeEach(() => {
    cy.addDsl(dsl);
  });

  it("Image Widget Functionality", function() {
    cy.get(viewWidgetsPage.imageWidget)
      .first()
      .trigger("mouseover");
    cy.get(viewWidgetsPage.imageWidget)
      .children(commonlocators.editicon)
      .first()
      .click({ force: true });
    //Checking the edit props for Image and also the properties of Image widget
    cy.testCodeMirror(
      "https://images.pexels.com/photos/60597/dahlia-red-blossom-bloom-60597.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    );
    cy.get(commonlocators.editPropCrossButton).click();
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
