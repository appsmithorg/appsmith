import dsl from "../../../../fixtures/buttondsl.json";
import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const { PropertyPane } = ObjectsRegistry;

describe("Property Pane Suggestions", () => {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Should show Property Pane Suggestions on / command", () => {
    cy.openPropertyPane("buttonwidget");
    PropertyPane.TypeTextIntoField("Label", "/");
    cy.get("ul.CodeMirror-hints")
      .contains("New Binding")
      .should("exist")
      .click();

    PropertyPane.ValidatePropertyFieldValue("Label", "{{}}");
  });

  it("2. Should show Property Pane Suggestions on typing {{}}", () => {
    cy.openPropertyPane("buttonwidget");
    PropertyPane.TypeTextIntoField("Label", "{{");
    cy.get("ul.CodeMirror-hints")
      .contains("appsmith")
      .should("exist")
      .click();

    PropertyPane.ValidatePropertyFieldValue("Label", "{{appsmith}}");
  });
});
