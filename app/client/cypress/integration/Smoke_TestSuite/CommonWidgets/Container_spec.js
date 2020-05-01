const widgetsPage = require("../../../locators/Widgets.json");
const commonlocators = require("../../../locators/commonlocators.json");
const dsl = require("../../../fixtures/commondsl.json");

describe("Container Widget Functionality", function() {
  beforeEach(() => {
    cy.addDsl(dsl);
  });

  it("Container Widget Functionality", function() {
    cy.get(widgetsPage.containerWidget)
      .first()
      .trigger("mouseover", { force: true });
    cy.get(widgetsPage.containerWidget)
      .get(commonlocators.editIcon)
      .first()
      .click();
    //Checking the edit props for container changing the background color of container
    cy.testCodeMirror("#C0C0C0");
    cy.get(commonlocators.editPropCrossButton).click();
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
