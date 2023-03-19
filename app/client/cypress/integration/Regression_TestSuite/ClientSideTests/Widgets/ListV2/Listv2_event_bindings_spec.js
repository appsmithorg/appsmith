const simpleListWithInputAndButtonDSL = require("../../../../../fixtures/Listv2/simpleListWithInputAndButton.json");
const commonlocators = require("../../../../../locators/commonlocators.json");

const toggleJSButton = (name) => `.t--property-control-${name} .t--js-toggle`;
const widgetSelector = (name) => `[data-widgetname-cy="${name}"]`;

describe("Listv2 - Event bindings", () => {
  it("1. simple list widget should have access to currentItem, currentIndex and currentView", () => {
    cy.addDsl(simpleListWithInputAndButtonDSL);
    cy.wait(4000);
    // Open the property pane of button in the inner list widget
    cy.openPropertyPane("buttonwidget");

    // Enable JS mode for onClick
    cy.get(toggleJSButton("onclick")).click({ force: true });

    cy.testJsontext(
      "onclick",
      "{{showAlert(`${currentView.Input1.text} _ ${currentItem.id} _ ${currentIndex}`)}}",
    );
    // Enter text in the parent list widget's text input
    cy.get(widgetSelector("Input1")).find("input").type("Input");

    // click the button on inner list 1st row.
    cy.get(widgetSelector("Button1")).find("button").click({ force: true });

    cy.get(commonlocators.toastmsg).contains("Input _ 000 _ 0");
  });

  it("2. simple list widget should get updated values of currentView", () => {
    // Enter text in the parent list widget's text input
    cy.get(widgetSelector("Input1"))
      .find("input")
      .clear()
      .type("Updated Input");

    // click the button on inner list 1st row.
    cy.get(widgetSelector("Button1")).find("button").click({ force: true });

    cy.wait(1000);

    cy.get(commonlocators.toastmsg).contains("Updated Input _ 000 _ 0");
  });
});
