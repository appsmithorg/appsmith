const widgetsPage = require("../../../locators/Widgets.json");
const commonlocators = require("../../../locators/commonlocators.json");
const dsl = require("../../../fixtures/commondsl.json");

describe("Button Widget Functionality", function() {
  beforeEach(() => {
    cy.addDsl(dsl);
  });

  it("Button Widget Functionality", function() {
    cy.get(".t--nav-link-widgets-editor").click();
    cy.get(widgetsPage.buttonWidget).click({ force: true });

    //Changing the text on the Button
    cy.testCodeMirror("Test Button Text");

    //Select and verify the Show Modal from the onClick dropdown
    cy.get(widgetsPage.buttonOnClick)
      .get(commonlocators.dropdownSelectButton)
      .click({ force: true })
      .get("ul.bp3-menu")
      .children()
      .contains("Show Modal")
      .click();
    cy.get(widgetsPage.buttonOnClick)
      .get(commonlocators.dropdownSelectButton)
      .find(".bp3-button-text")
      .should("have.text", "Show Modal");

    //Verify Modal Widget
    cy.CreateModal();
  });

  afterEach(() => {
    //clean up
    cy.DeleteModal();
  });
});
