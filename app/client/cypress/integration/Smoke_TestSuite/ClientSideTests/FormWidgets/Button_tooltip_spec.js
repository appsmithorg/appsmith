const dsl = require("../../../../fixtures/buttondsl.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const commonlocators = require("../../../../locators/commonlocators.json");

describe("Button Widget Functionality - Validate tooltip visibility", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Validate show tooltip on button hover", function() {
    cy.openPropertyPane("buttonwidget");
    // add tooltip
    cy.testJsontext(
      "tooltip",
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry",
    );
    cy.get(widgetsPage.buttonWidget).trigger("mouseover");
    // tooltip should show on hover
    cy.get(".bp3-popover.bp3-tooltip .bp3-popover-content").should(
      "have.text",
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry",
    );
  });

  it("Validate tooltip hidden for disabled button", function() {
    // first disable button
    cy.get(widgetsPage.toggleDisable).click({ force: true });
    cy.testJsontext("disabled", "true");
    cy.validateDisableWidget(
      widgetsPage.buttonWidget,
      commonlocators.disabledField,
    );
    // hover on button and check tooltip should not show
    cy.get(widgetsPage.buttonWidget).trigger("mouseover");
    cy.get(".bp3-popover.bp3-tooltip .bp3-popover-content").should("not.exist");
  });
});
