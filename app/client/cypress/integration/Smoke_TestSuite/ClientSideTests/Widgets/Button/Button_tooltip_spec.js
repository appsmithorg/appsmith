const dsl = require("../../../../../fixtures/buttondsl.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
const publish = require("../../../../../locators/publishWidgetspage.json");

describe("Button Widget Functionality - Validate tooltip visibility", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Validate show/hide tooltip feature on normal button", function() {
    cy.openPropertyPane("buttonwidget");
    // Add tooltip
    cy.testJsontext(
      "tooltip",
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry",
    );
    // Hover in
    cy.get(widgetsPage.buttonWidget).trigger("mouseover");
    // Check if a tooltip is displayed
    cy.get(".bp3-popover2-content").should(
      "have.text",
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry",
    );
    // Hover out
    cy.get(widgetsPage.buttonWidget).trigger("mouseout");
    // Check if the tooltip is disappeared
    cy.get(".bp3-popover2-content")
      .contains(
        "Lorem Ipsum is simply dummy text of the printing and typesetting industry",
      )
      .should("not.exist");
  });

  it("Validate show/hide tooltip feature for a disabled button on deploy", function() {
    // Disable the button
    cy.get(".t--property-control-disabled .bp3-switch").click({ force: true });
    cy.validateDisableWidget(
      widgetsPage.buttonWidget,
      commonlocators.disabledField,
    );
    // Publish
    cy.PublishtheApp();
    // Hover in
    cy.get(publish.buttonWidget).trigger("mouseover");
    // Check if a tooltip is displayed
    cy.get(".bp3-popover2-content").should(
      "have.text",
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry",
    );
    // Hover out
    cy.get(publish.buttonWidget).trigger("mouseout");
    // Check if the tooltip is disappeared
    cy.get(".bp3-popover2-content")
      .contains(
        "Lorem Ipsum is simply dummy text of the printing and typesetting industry",
      )
      .should("not.exist");
  });
});
