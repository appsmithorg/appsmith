const dsl = require("../../../fixtures/commondsl.json");
const pages = require("../../../locators/Pages.json");
const dynamicInputLocators = require("../../../locators/DynamicInput.json");

describe("Dynamic input autocomplete", () => {
  beforeEach(() => {
    cy.addDsl(dsl);
  });
  it("opens autocomplete for bindings", () => {
    cy.get(pages.widgetsEditor).click();
    cy.openPropertyPane("buttonwidget");
    cy.get(dynamicInputLocators.input)
      .first()
      .focus()
      .type("{ctrl}{shift}{downarrow}")
      .then($cm => {
        if ($cm.val() !== "") {
          cy.get(dynamicInputLocators.input)
            .first()
            .clear({
              force: true,
            });
        }

        cy.get(dynamicInputLocators.input)
          .first()
          .type("{{", {
            force: true,
            parseSpecialCharSequences: false,
          });

        // Tests if autocomplete will open
        cy.get(dynamicInputLocators.hints).should("exist");

        // Tests if data tree entities are sorted
        cy.get(`${dynamicInputLocators.hints} li`)
          .first()
          .should("have.text", "Aditya");

        // Tests if "No suggestions" message will pop if you type any garbage
        cy.get(dynamicInputLocators.input)
          .first()
          .type("garbage", {
            force: true,
            parseSpecialCharSequences: false,
          })
          .then(() => {
            cy.get(".CodeMirror-Tern-tooltip").should(
              "have.text",
              "No suggestions",
            );
          });
      });
  });
});
