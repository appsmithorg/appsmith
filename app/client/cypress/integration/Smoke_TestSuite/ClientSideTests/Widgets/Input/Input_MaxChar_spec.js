const dsl = require("../../../../../fixtures/inputMaxCharDsl.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
const widgetsPage = require("../../../../../locators/Widgets.json");

describe("Input Widget Max Char Functionality", function() {
  beforeEach(() => {
    cy.addDsl(dsl);
  });

  it("Text Input maxChar shows error if defaultText longer", () => {
    cy.get(widgetsPage.innertext).click();
    cy.get(".bp3-popover-content").should(($x) => {
      expect($x).contain("Default text length must be less than 5 characters");
    });
  });

  it("Text Input maxChar shows error if inputText longer than maxChar", () => {
    cy.openPropertyPane("inputwidgetv2");
    cy.clearComputedValueFirst();
    cy.testJsontext("defaulttext", "");
    cy.closePropertyPane("inputwidgetv2");

    cy.get(widgetsPage.innertext)
      .click({ force: true })
      .type("1234567");

    cy.openPropertyPane("inputwidgetv2");
    cy.updateComputedValue(3);
    cy.closePropertyPane("inputwidgetv2");

    cy.get(widgetsPage.innertext).click();
    cy.wait(1000);
    cy.get(".bp3-popover-content").should(($x) => {
      expect($x).contain("Input text length must be less than 3 characters");
    });
  });

  it("Number Input will not show error for maxChar validation", () => {
    cy.openPropertyPane("inputwidgetv2");
    cy.selectDropdownValue(commonlocators.dataType, "Number");
    cy.get(".bp3-popover-content").should("not.exist");
  });
});
