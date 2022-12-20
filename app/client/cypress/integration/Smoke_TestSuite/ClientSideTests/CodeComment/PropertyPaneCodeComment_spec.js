import dsl from "../../../../fixtures/buttondsl.json";
import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const { PropertyPane } = ObjectsRegistry;

describe("Property Pane Code Commenting", () => {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Should comment code in Property Pane", () => {
    cy.openPropertyPane("buttonwidget");
    PropertyPane.TypeTextIntoField("Label", "{{appsmith}}");
    PropertyPane.ToggleCommentInTextField("Label");

    PropertyPane.ValidatePropertyFieldValue("Label", "{{// appsmith}}");
  });

  it("2. Should show Property Pane Suggestions on typing {{}}", () => {
    cy.openPropertyPane("buttonwidget");
    PropertyPane.TypeTextIntoField("Label", "{{// appsmith}}");
    PropertyPane.ToggleCommentInTextField("Label");

    PropertyPane.ValidatePropertyFieldValue("Label", "{{appsmith}}");
  });
});
