const explorer = require("../../../../locators/explorerlocators.json");
const dynamicInputLocators = require("../../../../locators/DynamicInput.json");

describe("Autocomplete bug fixes", function() {
  const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
  it("Verifies if selectedRow is in best match", function() {
    cy.get(explorer.addWidget).click();
    cy.dragAndDropToCanvas("tablewidgetv2", { x: 200, y: 200 });
    cy.dragAndDropToCanvas("textwidget", { x: 200, y: 600 });
    cy.openPropertyPane("textwidget");
    cy.EnableAllCodeEditors();
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type("{ctrl}{shift}{downarrow}")
      .then(($cm) => {
        if ($cm.val() !== "") {
          cy.get(".CodeMirror textarea")
            .first()
            .clear({
              force: true,
            });
        }
        cy.get(".CodeMirror textarea")
          .first()
          .type("{{Table1.", {
            force: true,
            parseSpecialCharSequences: false,
          });
        cy.wait(500);
        cy.get(dynamicInputLocators.hints).should("exist");
        cy.get(`${dynamicInputLocators.hints} li`)
          .eq(0)
          .should("have.text", "Best Match");
        cy.get(`${dynamicInputLocators.hints} li`)
          .eq(1)
          .should("have.text", "selectedRow");
      });
  });

  it("Checks if copied widget show up on autocomplete suggestions", function() {
    cy.dragAndDropToCanvas("buttonwidget", { x: 200, y: 200 });
    cy.get(`#div-selection-0`).click({
      force: true,
    });
    cy.get("body").type(`{${modifierKey}}{a}`);
    cy.wait(500);
    cy.get("body").type(`{${modifierKey}}{c}`);
    cy.wait(500);
    cy.get("body").type(`{${modifierKey}}{v}`);
    cy.wait(500);
    cy.openPropertyPane("buttonwidget");
    cy.EnableAllCodeEditors();
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type("{ctrl}{shift}{downarrow}")
      .then(($cm) => {
        if ($cm.val() !== "") {
          cy.get(".CodeMirror textarea")
            .first()
            .clear({
              force: true,
            });
        }
        cy.get(".CodeMirror textarea")
          .first()
          .type("{{Butto", {
            force: true,
            parseSpecialCharSequences: false,
          });
        cy.wait(500);
        cy.get(dynamicInputLocators.hints).should("exist");
        cy.get(`${dynamicInputLocators.hints} li`)
          .eq(0)
          .should("have.text", "Best Match");
        cy.get(`${dynamicInputLocators.hints} li`)
          .eq(1)
          .should("have.text", "Button1Copy.text");
      });
  });
});
