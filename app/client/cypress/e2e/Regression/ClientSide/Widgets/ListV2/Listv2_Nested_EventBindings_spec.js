const nestedListDSL = require("../../../../../fixtures/Listv2/nestedList.json");
const commonlocators = require("../../../../../locators/commonlocators.json");

const toggleJSButton = (name) => `.t--property-control-${name} .t--js-toggle`;
const widgetSelector = (name) => `[data-widgetname-cy="${name}"]`;

describe(
  "Listv2 - Event bindings spec",
  { tags: ["@tag.Widget", "@tag.List", "@tag.Sanity"] },
  () => {
    it("1. nested list - inner widget should have access to currentItem, currentIndex, currentView and level_1", () => {
      cy.addDsl(nestedListDSL);
      cy.wait(4000);
      // Open the property pane of button in the inner list widget
      cy.openPropertyPane("buttonwidget");

      // Enable JS mode for onClick
      cy.get(toggleJSButton("onclick")).click({ force: true });

      cy.testJsontext(
        "onclick",
        "{{showAlert(`${level_1.currentView.Text1.text} _ ${level_1.currentItem.id} _ ${level_1.currentIndex} _ ${level_1.currentView.Input1.text} _ ${currentView.Input2.text}`)}}",
      );
      // Enter text in the parent list widget's text input
      cy.get(widgetSelector("Input1")).find("input").type("outer input");

      // Enter text in the child list widget's text input in first row
      cy.get(widgetSelector("Input2")).find("input").type("inner input");

      // click the button on inner list 1st row.
      cy.get(widgetSelector("Button3")).find("button").click({ force: true });

      cy.get(commonlocators.toastmsg).contains(
        "Blue _ 001 _ 0 _ outer input _ inner input",
      );
    });

    it("2. nested list - inner widget should get updated values of currentView and level_1", () => {
      // Enter text in the parent list widget's text input
      cy.get(widgetSelector("Input1"))
        .find("input")
        .clear()
        .type("outer input updated");

      // Enter text in the child list widget's text input in first row
      cy.get(widgetSelector("Input2"))
        .find("input")
        .clear()
        .type("inner input updated");

      // click the button on inner list 1st row.
      cy.get(widgetSelector("Button3")).find("button").click({ force: true });

      cy.wait(1000);

      cy.get(commonlocators.toastmsg).contains(
        "Blue _ 001 _ 0 _ outer input updated _ inner input updated",
      );
    });
  },
);
