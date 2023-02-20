const dsl = require("../../../../../../fixtures/Listv2/simpleListWithInputAndButton.json");
const commonlocators = require("../../../../../../locators/commonlocators.json");

const widgetSelector = (name) => `[data-widgetname-cy="${name}"]`;
const toggleJSButton = (name) => `.t--property-control-${name} .t--js-toggle`;

describe("List v2- Tabs Widget", () => {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. should not throw error when on click event is changed No Action", () => {
    cy.openPropertyPaneByWidgetName("Button1", "buttonwidget");

    // Enable JS mode for onClick
    cy.get(toggleJSButton("onclick")).click({ force: true });

    cy.testJsontext("onclick", "{{showAlert('Hello')}}");

    cy.get(widgetSelector("Button1"))
      .find("button")
      .click({ force: true });

    cy.get(commonlocators.toastmsg).contains("Hello");

    // Wait for toastmsg to close
    cy.wait(1000);
    cy.get(commonlocators.toastmsg).should("not.exist");

    // Clear the event
    cy.testJsontext("onclick", "");

    cy.get(widgetSelector("Button1"))
      .find("button")
      .click({ force: true });

    cy.wait(1000);

    cy.get(commonlocators.toastmsg, { timeout: 500 }).should("not.exist");
  });
});
