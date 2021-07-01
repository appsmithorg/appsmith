/// <reference types="Cypress" />

const dsl = require("../../../../fixtures/commondsl.json");
const pages = require("../../../../locators/Pages.json");
const dynamicInputLocators = require("../../../../locators/DynamicInput.json");
const apiwidget = require("../../../../locators/apiWidgetslocator.json");

describe("Dynamic input autocomplete", () => {
  beforeEach(() => {
    cy.addDsl(dsl);
  });
  it("opens autocomplete for bindings", () => {
    cy.openPropertyPane("buttonwidget");
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
          .should("have.text", "Aditya.backgroundColor");

        // Tests if "No suggestions" message will pop if you type any garbage
        cy.get(dynamicInputLocators.input)
          .first()
          .click({ force: true })
          .type("{uparrow}", { parseSpecialCharSequences: true })
          .type("{ctrl}{shift}{downarrow}", { parseSpecialCharSequences: true })
          .type("{{ garbage", {
            parseSpecialCharSequences: true,
          })
          .then(() => {
            cy.get(".CodeMirror-Tern-tooltip").should(
              "have.text",
              "No suggestions",
            );
          });
      });
  });
  it("opens current value popup", () => {
    // Test on widgets pane
    cy.openPropertyPane("buttonwidget");
    cy.get(dynamicInputLocators.input)
      .first()
      .click({ force: true });
    cy.evaluateErrorMessage("ReferenceError: garbage is not defined");
    // Test on api pane
    cy.NavigateToAPI_Panel();
    cy.get(apiwidget.createapi).click({ force: true });
    cy.wait("@createNewApi");
    cy.get(apiwidget.headerValue).within(() => {
      cy.get("textarea").click({ force: true });
    });
    cy.assertEvaluatedValuePopup("string");
  });
});
