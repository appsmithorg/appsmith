const commonlocators = require("../../../../locators/commonlocators.json");
const dsl = require("../../../../fixtures/dropDownWidget_reset_check_dsl.json");

describe("Dropdown Widget Check value does not reset on navigation", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("check if the dropdown value does not change on navigation", function() {
    //Change the value of drop down;
    cy.get(".t--draggable-selectwidget .bp3-popover-target")
      .first()
      .click();
    cy.selectOnClickOption("Red");
    cy.wait(200);

    //Navigate
    cy.NavigateToAPI_Panel();

    //Again navigate back to the widget
    cy.SearchEntityandOpen("Select3");

    //Check for the select value again
    cy.get(
      `.t--draggable-selectwidget .bp3-popover-target ${commonlocators.menuSelection}`,
    )
      .first()
      .should("have.text", "Red");
  });
});
afterEach(() => {
  cy.goToEditFromPublish();
});
