const dsl = require("../../../../fixtures/inputMaxCharDsl.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const widgetsPage = require("../../../../locators/Widgets.json");

describe("Input Widget Max Char Functionality", function() {
  beforeEach(() => {
    cy.addDsl(dsl);
  });

  it("Text Input maxChar shows error if defaultText longer", () => {
    cy.get(widgetsPage.innertext).click();
    cy.get(".bp3-popover-content").should(($x) => {
      expect($x).contain(
        "Default Text length must be less than Max Chars allowed",
      );
    });
  });

  it("Number Input will not show error for maxChar validation", () => {
    cy.openPropertyPane("inputwidgetv2");
    cy.selectDropdownValue(commonlocators.dataType, "Number");
    cy.get(".bp3-popover-content").should("not.exist");
  });
});
