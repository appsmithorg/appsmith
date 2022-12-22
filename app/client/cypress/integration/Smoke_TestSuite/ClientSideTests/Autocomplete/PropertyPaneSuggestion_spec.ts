import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const { AggregateHelper, EntityExplorer, PropertyPane } = ObjectsRegistry;

describe("Property Pane Suggestions", () => {
  before(() => {
    cy.fixture("buttondsl").then((val: any) => {
      AggregateHelper.AddDsl(val);
    });
  });

  it("1. Should show Property Pane Suggestions on / command", () => {
    EntityExplorer.SelectEntityByName("Button1", "Widgets");
    PropertyPane.TypeTextIntoField("Label", "{{appsmith}}");
    PropertyPane.TypeTextIntoField("Label", "/");
    cy.get("ul.CodeMirror-hints")
      .contains("New Binding")
      .should("exist")
      .click();

    PropertyPane.ValidatePropertyFieldValue("Label", "{{}}");
  });

  it("2. Should show Property Pane Suggestions on typing {{}}", () => {
    EntityExplorer.SelectEntityByName("Button1", "Widgets");
    PropertyPane.TypeTextIntoField("Label", "{{appsmith}}");
    PropertyPane.TypeTextIntoField("Label", "{{");
    cy.get("ul.CodeMirror-hints")
      .contains("appsmith")
      .should("exist")
      .click();

    PropertyPane.ValidatePropertyFieldValue("Label", "{{appsmith}}");
  });
});
