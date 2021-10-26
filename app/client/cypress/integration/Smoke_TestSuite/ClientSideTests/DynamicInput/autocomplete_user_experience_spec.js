const dsl = require("../../../../fixtures/autocomp.json");
const dynamicInputLocators = require("../../../../locators/DynamicInput.json");

describe("Autocomplete user experience", () => {
  before(() => {
    cy.addDsl(dsl);
  });
  it("Does not select first hint when Enter key is pressed", () => {
    cy.openPropertyPane("buttonwidget");
    cy.get(dynamicInputLocators.input)
      .first()
      .click({ force: true })
      .type("{uparrow}", { parseSpecialCharSequences: true })
      .type("{ctrl}{shift}{downarrow}", { parseSpecialCharSequences: true })
      .type("{{")
      .type("{enter}", { parseSpecialCharSequences: true });

    cy.focused().should("have.text", "");
  });
});
