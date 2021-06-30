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
      .focus()
      .type("{ctrl}{shift}{downarrow}", { parseSpecialCharSequences: true })
      .then(($cm) => {
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
          .eq(1)
          .should("have.text", "Aditya.backgroundColor");

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
  it("opens current value popup", () => {
    // Test on widgets pane
    cy.openPropertyPane("buttonwidget");
    cy.get(dynamicInputLocators.input)
      .first()
      .focus();
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
