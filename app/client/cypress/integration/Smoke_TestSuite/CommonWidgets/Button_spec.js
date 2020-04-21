const widgetsPage = require("../../../locators/Widgets.json");
const commonlocators = require("../../../locators/commonlocators.json");
const WidgetCardLocators = require("../../../locators/WidgetCard.json");

describe("Button Widget Functionality", function() {
  before(() => {
    cy.NavigateToAllWidgets();
    cy.get(".t--nav-link-widgets-editor").click();

    cy.get(WidgetCardLocators.buttonwidget)
      .first()
      .trigger("dragstart");

    cy.get(commonlocators.dropTarget)
      //NOTE: This is to select containers. Container 0 is not selectable.
      .eq(1)
      .trigger("drop", 200, 100);
    cy.get(commonlocators.dropTarget)
      .eq(1)
      .trigger("dragend", { force: true })
      .trigger("mouseup", { force: true });
  });

  after(() => {
    cy.get(widgetsPage.buttonWidget).click({ force: true });
    cy.get(commonlocators.widgetDelete).click({ force: true });
  });

  it("Test button spec", function() {
    cy.get(widgetsPage.buttonWidget)
      .trigger("mouseover", { force: true })
      .click({ force: true });

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
    // cy.CreateModal();
  });
});
