const explorer = require("../../../../locators/explorerlocators.json");

describe("FilePicker Widget Functionality", function() {
  before(() => {
    cy.visit("/applications");
    cy.get(".t--new-button")
      .first()
      .click();
    cy.get(".t--BuildFromScratch").click();
    cy.get(explorer.addWidget).click();
    cy.dragAndDropToCanvas("filepickerwidgetv2", { x: 200, y: 600 });
  });

  it("should test allowed values", () => {
    cy.openPropertyPane("filepickerwidgetv2");
    cy.get(".t--property-control-allowedfiletypes .t--js-toggle").click({
      force: true,
    });
    cy.testJsontext("allowedfiletypes", `[".csv"]`);
    cy.get(
      ".t--property-control-allowedfiletypes .t--codemirror-has-error",
    ).should("not.exist");
    cy.testJsontext("allowedfiletypes", ".csv");
    cy.get(
      ".t--property-control-allowedfiletypes .t--codemirror-has-error",
    ).should("exist");
    cy.testJsontext("allowedfiletypes", `[".csv", ".doc"]`);
    cy.get(
      ".t--property-control-allowedfiletypes .t--codemirror-has-error",
    ).should("not.exist");
  });
});
