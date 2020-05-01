const commonlocators = require("../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../locators/FormWidgets.json");
const dsl = require("../../../fixtures/formdsl.json");

describe("Radio Widget Functionality", function() {
  beforeEach(() => {
    cy.addDsl(dsl);
  });
  it("Radio Widget Functionality", function() {
    cy.get(formWidgetsPage.radioWidget)
      .first()
      .trigger("mouseover");
    cy.get(formWidgetsPage.radioWidget)
      .children(commonlocators.editicon)
      .first()
      .click({ force: true });
    //Checking the edit props for Radio Widget and also the properties of Radio widget
    cy.testCodeMirror("Test Radio");
    cy.get(formWidgetsPage.radioOnSelectionChangeDropdown)
      .get(commonlocators.dropdownSelectButton)
      .click({ force: true })
      .get("ul.bp3-menu")
      .children()
      .contains("Navigate To")
      .click();
    cy.get(formWidgetsPage.radioOnSelectionChangeDropdown)
      .get(commonlocators.dropdownSelectButton)
      .find("> .bp3-button-text")
      .should("have.text", "Navigate To");
    cy.get(commonlocators.editPropCrossButton).click();
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
