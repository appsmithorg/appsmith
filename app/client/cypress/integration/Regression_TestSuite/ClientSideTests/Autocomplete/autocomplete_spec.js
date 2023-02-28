const dsl = require("../../../../fixtures/autocomp.json");
const dynamicInputLocators = require("../../../../locators/DynamicInput.json");
const apiwidget = require("../../../../locators/apiWidgetslocator.json");

describe("Dynamic input autocomplete", () => {
  before(() => {
    cy.addDsl(dsl);
  });
  it("1. Opens autocomplete for bindings", () => {
    cy.selectEntityByName("TestModal");
    cy.wait(3000);
    cy.selectEntityByName("Aditya");
    cy.openPropertyPane("buttonwidget");
    cy.testJsontext("label", "", {
      parseSpecialCharSequences: true,
    });
    cy.get(dynamicInputLocators.input)
      .first()
      .click({ force: true })
      .type("{uparrow}", { parseSpecialCharSequences: true })
      .type("{ctrl}{shift}{downarrow}", { parseSpecialCharSequences: true })
      .type("{backspace}", { parseSpecialCharSequences: true })
      .then(() => {
        cy.get(dynamicInputLocators.input)
          .first()
          .click({ force: true })
          .type("{{", {
            parseSpecialCharSequences: true,
          });

        // Tests if autocomplete will open
        cy.get(dynamicInputLocators.hints).should("exist");
        // Tests if data tree entities are sorted
        cy.get(`${dynamicInputLocators.hints} li`)
          .eq(1)
          .should("have.text", "Button1.text");

        cy.testJsontext("label", "", {
          parseSpecialCharSequences: true,
        });
        // Tests if "No suggestions" message will pop if you type any garbage
        cy.get(dynamicInputLocators.input)
          .first()
          .click({ force: true })
          .type("{uparrow}", { parseSpecialCharSequences: true })
          .type("{ctrl}{shift}{downarrow}", { parseSpecialCharSequences: true })
          .type("{backspace}", { parseSpecialCharSequences: true })

          .then(() => {
            cy.get(dynamicInputLocators.input)
              .first()
              .click({ force: true })
              .type("{{garbage", {
                parseSpecialCharSequences: true,
              });
            cy.get(".CodeMirror-Tern-tooltip").should(
              "have.text",
              "No suggestions",
            );
          });
      });
    cy.evaluateErrorMessage("garbage is not defined");
  });

  it("2. Test if action inside non event field throws error & open current value popup", () => {
    cy.get(dynamicInputLocators.input)
      .first()
      .click({ force: true })
      .type("{backspace}".repeat(12))
      .type("{{storeValue()}}", { parseSpecialCharSequences: false });

    cy.wait(1000);

    cy.evaluateErrorMessage(
      "Found a reference to {{actionName}} during evaluation. Sync fields cannot execute framework actions. Please remove any direct/indirect references to {{actionName}} and try again.".replaceAll(
        "{{actionName}}",
        "storeValue()",
      ),
    );
  });
});
