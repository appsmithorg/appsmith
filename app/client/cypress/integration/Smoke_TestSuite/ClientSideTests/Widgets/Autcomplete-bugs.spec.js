const explorer = require("../../../../locators/explorerlocators.json");

describe("Widget field validation on invalid inputs", () => {
  it("Check if options field of a select widget should validation error when bound to a non existing field", () => {
    cy.get(explorer.addWidget).click();
    cy.dragAndDropToCanvas("tablewidgetv2", { x: 200, y: 200 });
    cy.dragAndDropToCanvas("selectwidget", { x: 200, y: 600 });
    cy.openPropertyPane("selectwidget");
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
          .type("{{Table1.test", {
            force: true,
            parseSpecialCharSequences: false,
          });
      });
    cy.evaluateErrorMessage(
      'This value does not evaluate to type Array<{ "label": "string", "value": "string" }>',
    );
  });
});
