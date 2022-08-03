import { ObjectsRegistry } from "../../../../support/Objects/Registry";
const {
  CommonLocators,
  EntityExplorer,
  JSEditor,
  PropertyPane,
} = ObjectsRegistry;

describe("Autocomplete bug fixes", function() {
  const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
  it("1. Bug #12790 Verifies if selectedRow is in best match", function() {
    EntityExplorer.DragDropWidgetNVerify("tablewidgetv2", 200, 200);
    EntityExplorer.DragDropWidgetNVerify("textwidget", 200, 600);
    EntityExplorer.SelectEntityByName("Text1");
    PropertyPane.UpdatePropertyFieldValue("Text", "{{Table1.}}");
    cy.get("body").type(`{end}{leftArrow}{leftArrow}`);
    cy.get("body").type(`{ctrl} `);
    cy.get(CommonLocators._hints).should("exist");
    cy.get(`${CommonLocators._hints} li`)
      .eq(0)
      .should("have.text", "Best Match");
    cy.get(`${CommonLocators._hints} li`)
      .eq(1)
      .should("have.text", "selectedRow");
  });

  it("2. Bug #14990 Checks if copied widget show up on autocomplete suggestions", function() {
    cy.get(`#div-selection-0`).click({
      force: true,
    });
    EntityExplorer.SelectEntityByName("Text1");
    cy.get("body").type(`{${modifierKey}}{c}`);
    cy.get("body").type(`{${modifierKey}}{v}`);
    EntityExplorer.SelectEntityByName("Text1");
    PropertyPane.UpdatePropertyFieldValue("Text", "");
    JSEditor.EnterJSContext("Text", "{{Te", false);
    cy.get(CommonLocators._hints).should("exist");
    cy.get(`${CommonLocators._hints} li`)
      .eq(0)
      .should("have.text", "Best Match");
    cy.get(`${CommonLocators._hints} li`)
      .eq(1)
      .should("have.text", "Text1Copy.text");
  });
});
